import ts from 'typescript'
import type { AnalysisRequest, AnalysisResponse } from './types'
import type { ArchitectureModel, Element, RepositoryFileRecord, RepositorySnapshot, SourceEvidence } from '../domain'
import { analyzeStack } from './stack-analyzers'

const ANALYZER = `typescript-${ts.version}+stack-1`
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']
const MAX_ELEMENTS = 100_000
const MAX_SYMBOLS = 35_000
const MAX_IMPORT_EDGES = 100_000
const MAX_DEPENDENCY_EDGES = 10_000

type ModuleReference = { specifier: string; line: number; rule: string; order: number }
type FileParse = { path: string; hash: string; fileId: string; refs: ModuleReference[] }

function stableId(type: string, key: string) { return `${type}:${key.replaceAll('\\', '/')}` }
function dirname(path: string) { const at = path.lastIndexOf('/'); return at < 0 ? '' : path.slice(0, at) }
function basename(path: string) { return path.slice(path.lastIndexOf('/') + 1) }
function extension(path: string) { const name = basename(path); const dot = name.lastIndexOf('.'); return dot < 0 ? '' : name.slice(dot).toLowerCase() }
function lineAt(source: ts.SourceFile, pos: number) { return source.getLineAndCharacterOfPosition(pos).line + 1 }
function isExported(node: ts.Node) { return ts.canHaveModifiers(node) && !!ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword) }
function sourceEvidence(path: string, hash: string, line: number, rule: string, summary: string): SourceEvidence { return { path, startLine: line, contentHash: hash, analyzer: ANALYZER, rule, summary } }
function moduleCandidate(base: string) { const extensions = [...CODE_EXTENSIONS, '.d.ts', '.json']; return [base, ...extensions.map((extension) => `${base}${extension}`), ...extensions.map((extension) => `${base}/index${extension}`)] }
function normalizePath(path: string) { return path.replace(/\\/g, '/').split('/').reduce<string[]>((parts, segment) => { if (!segment || segment === '.') return parts; if (segment === '..') parts.pop(); else parts.push(segment); return parts }, []).join('/') }

async function sha256(value: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619) }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function resolveLocal(specifier: string, sourcePath: string, knownPaths: Set<string>, aliases: { pattern: string; targets: string[]; base: string }[]): string | undefined {
  const rawCandidates: string[] = []
  if (specifier.startsWith('.') || specifier.startsWith('/')) rawCandidates.push(...moduleCandidate(specifier.startsWith('/') ? specifier.slice(1) : `${dirname(sourcePath)}/${specifier}`))
  for (const alias of aliases) {
    const star = alias.pattern.indexOf('*')
    const prefix = star < 0 ? alias.pattern : alias.pattern.slice(0, star)
    const suffix = star < 0 ? '' : alias.pattern.slice(star + 1)
    if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) continue
    const middle = specifier.slice(prefix.length, suffix ? -suffix.length : undefined)
    for (const target of alias.targets) rawCandidates.push(...moduleCandidate(`${alias.base}/${target.replace('*', middle)}`))
  }
  for (const candidate of rawCandidates) {
    const normalized = candidate.replace(/\\/g, '/').replace(/^\.\//, '').split('/').reduce<string[]>((parts, segment) => {
      if (!segment || segment === '.') return parts
      if (segment === '..') parts.pop()
      else parts.push(segment)
      return parts
    }, []).join('/')
    if (knownPaths.has(normalized)) return normalized
  }
  return undefined
}

function routePath(path: string, appRoot: string) {
  let relative = path.slice(appRoot.length).replace(/^\//, '')
  const leaf = basename(relative).replace(/\.[^.]+$/, '')
  relative = relative.slice(0, Math.max(0, relative.length - basename(relative).length)).replace(/\/$/, '')
  let segments = relative.split('/').filter(Boolean).filter((part) => !part.startsWith('(') && !part.startsWith('@'))
  if (leaf !== 'page' && leaf !== 'route') segments.push(leaf)
  segments = segments.map((part) => part.replace(/^\[\[\.\.\.(.+)\]\]$/, '*$1?').replace(/^\[\.\.\.(.+)\]$/, '*$1').replace(/^\[(.+)\]$/, ':$1'))
  const value = `/${segments.join('/')}`.replace(/\/$/, '')
  return value || '/'
}

function nextRole(path: string, text: string, nextDetected: boolean) {
  if (!nextDetected || !/(^|\/)(app|src\/app)\//.test(path)) return undefined
  const directive = /^\s*(['"])use client\1/m.exec(text)
  if (directive) return { role: 'client component', status: 'observed' as const, line: text.slice(0, directive.index + directive[0].length).split('\n').length, rule: 'next.use-client' }
  if (/(^|\/)(page|layout|default|template)\.[^.]+$/.test(path)) return { role: 'server component (App Router default)', status: 'inferred' as const, line: 1, rule: 'next.app-router-server-default' }
  return undefined
}

function progress(requestId: string, phase: string, completed: number, total: number, path?: string) {
  self.postMessage({ type: 'progress', requestId, phase, completed, total, path } satisfies AnalysisResponse)
}

async function analyze(request: AnalysisRequest) {
  const filesByPath = new Map(request.files.map((file) => [file.path, file]))
  const knownPaths = new Set(filesByPath.keys())
  const hashes = new Map<string, string>()
  const fileParses: FileParse[] = []
  const warnings: RepositorySnapshot['warnings'] = request.skipped.map((file) => ({ path: file.path, code: 'file-skipped', message: file.reason }))
  const records: RepositoryFileRecord[] = request.skipped.map((file) => ({ path: file.path, size: file.size, status: 'skipped', reason: file.reason, elementIds: [] }))
  const model: ArchitectureModel = { elements: [], relationships: [], flows: [] }
  const sourceElementIds = new Map<string, string>()
  const dependencySet = new Map<string, { name: string; dependencies: Set<string>; path: string }>()
  const tsConfigs: { path: string; compilerOptions: { baseUrl?: string; paths?: Record<string, string[]> } }[] = []
  let nextDetected = false
  let packageManager: string | undefined
  const sortedInputs = [...request.files].sort((a, b) => a.path.localeCompare(b.path))
  const fileElements: Element[] = []
  let exportedSymbolCount = 0
  let symbolLimitNoted = false

  for (let index = 0; index < sortedInputs.length; index++) {
    const input = sortedInputs[index]
    progress(request.requestId, 'hash and inventory', index + 1, sortedInputs.length, input.path)
    const hash = await sha256(input.text)
    hashes.set(input.path, hash)
    const extensionName = extension(input.path)
    const id = stableId('source-file', input.path)
    const element: Element = { id, kind: 'file', name: basename(input.path), description: '', path: input.path, status: 'observed', tags: extensionName ? [extensionName.slice(1)] : [], x: 70 + (fileElements.length % 4) * 225, y: 200 + Math.floor(fileElements.length / 4) * 200, source: sourceEvidence(input.path, hash, 1, 'file.inventory', 'File was present in the selected local repository.') }
    sourceElementIds.set(input.path, id)
    fileElements.push(element)
    records.push({ path: input.path, hash, size: input.size, language: CODE_EXTENSIONS.includes(extensionName) ? (['.ts', '.tsx', '.mts', '.cts'].includes(extensionName) ? 'typescript' : 'javascript') : extensionName.slice(1) || 'other', status: 'indexed', elementIds: [id] })
    if (input.path.endsWith('package.json')) {
      try {
        const pkg = JSON.parse(input.text) as { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; packageManager?: string }
        const packageRecord = records.find((file) => file.path === input.path)
        if (packageRecord) packageRecord.status = 'parsed'
        const pkgName = pkg.name || (dirname(input.path) ? basename(dirname(input.path)) : request.rootName)
        const packageId = stableId('package', input.path)
        const packageIndex = dependencySet.size
        const packageElement: Element = { id: packageId, kind: 'package', name: pkgName, description: `Package manifest at ${input.path}.`, path: dirname(input.path), status: 'observed', tags: ['package.json'], x: 60 + (packageIndex % 4) * 235, y: 60 + Math.floor(packageIndex / 4) * 100, source: sourceEvidence(input.path, hash, 1, 'package.manifest', 'Package identity and dependencies were read from package.json.') }
        model.elements.push(packageElement)
        model.relationships.push({ id: stableId('contains', input.path), fromId: packageId, toId: id, kind: 'contains', label: 'manifest', status: 'observed', source: sourceEvidence(input.path, hash, 1, 'package.manifest', 'Package contains this manifest.') })
        if (packageRecord) packageRecord.elementIds.push(packageId)
        dependencySet.set(input.path, { name: pkgName, dependencies: new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]), path: input.path })
        if (pkg.packageManager) packageManager ??= pkg.packageManager.split('@')[0]
        if (pkg.dependencies?.next || pkg.devDependencies?.next) nextDetected = true
      } catch {
        warnings.push({ path: input.path, code: 'manifest-parse-error', message: 'Could not parse package.json; package dependencies were not extracted.' })
        const record = records.find((file) => file.path === input.path)
        if (record) { record.status = 'error'; record.reason = 'Invalid JSON.' }
      }
    } else if (basename(input.path) === 'tsconfig.json' || basename(input.path) === 'jsconfig.json') {
      const parsed = ts.parseConfigFileTextToJson(input.path, input.text)
      if (parsed.error || !parsed.config || typeof parsed.config !== 'object') {
        warnings.push({ path: input.path, code: 'config-parse-error', message: 'Could not parse TypeScript project configuration.' })
        const configRecord = records.find((file) => file.path === input.path)
        if (configRecord) { configRecord.status = 'error'; configRecord.reason = 'Invalid TypeScript project configuration.' }
      }
      else {
        const configRecord = records.find((file) => file.path === input.path)
        if (configRecord) configRecord.status = 'parsed'
        const config = parsed.config as { extends?: unknown; compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> } }
        tsConfigs.push({ path: input.path, compilerOptions: config.compilerOptions ?? {} })
        if (config.extends) warnings.push({ path: input.path, code: 'tsconfig-extends-not-followed', message: 'This local analyzer reads path aliases from this config file but does not load extended configuration files.' })
      }
    } else if (/^pnpm-lock\.yaml$/.test(basename(input.path))) packageManager ??= 'pnpm'
    else if (basename(input.path) === 'yarn.lock') packageManager ??= 'yarn'
    else if (basename(input.path) === 'package-lock.json') packageManager ??= 'npm'
  }

  const recordLookup = new Map(records.map((record) => [record.path, record]))
  const fileElementByPath = new Map(fileElements.map((element) => [element.path, element]))
  const parseTotal = sortedInputs.filter((file) => CODE_EXTENSIONS.includes(extension(file.path))).length
  let parsedCount = 0
  for (const input of sortedInputs) {
    if (!CODE_EXTENSIONS.includes(extension(input.path))) continue
    parsedCount++
    if (parsedCount % 20 === 0 || parsedCount === 1 || parsedCount === parseTotal) progress(request.requestId, 'parsing TypeScript and JavaScript syntax', parsedCount, parseTotal, input.path)
    const hash = hashes.get(input.path)!
    const fileId = sourceElementIds.get(input.path)!
    const source = ts.createSourceFile(input.path, input.text, ts.ScriptTarget.Latest, true, ['.tsx', '.jsx'].includes(extension(input.path)) ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const refs: ModuleReference[] = []
    const symbolOccurrences = new Map<string, number>()
    const parseDiagnostics = (source as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
    const diagnostics = parseDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    if (diagnostics.length) {
      warnings.push({ path: input.path, code: 'parse-error', message: diagnostics[0].slice(0, 220) })
      const record = recordLookup.get(input.path)
      if (record) { record.status = 'error'; record.reason = diagnostics[0].slice(0, 220) }
    } else { const record = recordLookup.get(input.path); if (record) record.status = 'parsed' }
    const role = nextRole(input.path, input.text, nextDetected)
    const fileElement = fileElementByPath.get(input.path)!
    if (role) {
      fileElement.description = role.role
      fileElement.tags.push(role.role.startsWith('client') ? 'client-component' : 'server-component')
      fileElement.status = role.status
      fileElement.source = sourceEvidence(input.path, hash, role.line, role.rule, role.role)
    }
    if (!diagnostics.length) {
    let order = 0
    const addRef = (specifier: string, pos: number, rule: string) => refs.push({ specifier, line: lineAt(source, pos), rule, order: order++ })
    const addSymbol = (name: string, kind: Element['kind'], node: ts.Node, rule: string) => {
      if (exportedSymbolCount >= MAX_SYMBOLS || model.elements.length >= MAX_ELEMENTS) {
        if (!symbolLimitNoted) warnings.push({ path: input.path, code: 'symbol-limit-reached', message: `The local model reached its ${MAX_SYMBOLS.toLocaleString()} exported-symbol limit; further declarations were skipped.` })
        symbolLimitNoted = true
        return
      }
      exportedSymbolCount++
      const occurrenceKey = `${kind}:${name}`
      const occurrence = symbolOccurrences.get(occurrenceKey) ?? 0
      symbolOccurrences.set(occurrenceKey, occurrence + 1)
      const symbolId = stableId(`symbol-${kind}`, `${input.path}#${name}:${occurrence}`)
      const line = lineAt(source, node.getStart(source))
      const symbol: Element = { id: symbolId, kind, name, description: '', path: input.path, status: 'observed', tags: ['exported'], x: fileElement.x + 16, y: fileElement.y + 76, source: sourceEvidence(input.path, hash, line, rule, `Exported ${kind} declaration ${name}.`) }
      model.elements.push(symbol)
      model.relationships.push({ id: stableId('contains', `${input.path}#${name}:${occurrence}`), fromId: fileId, toId: symbolId, kind: 'contains', label: 'exports', status: 'observed', source: symbol.source })
      const record = recordLookup.get(input.path)
      if (record) record.elementIds.push(symbolId)
    }
    for (const statement of source.statements) {
      if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) addRef(statement.moduleSpecifier.text, statement.moduleSpecifier.getStart(source), ts.isImportDeclaration(statement) ? 'typescript.import' : 'typescript.re-export')
      if (ts.isFunctionDeclaration(statement) && statement.name && isExported(statement)) addSymbol(statement.name.text, 'function', statement, 'typescript.exported-function')
      else if (ts.isClassDeclaration(statement) && statement.name && isExported(statement)) addSymbol(statement.name.text, 'class', statement, 'typescript.exported-class')
      else if (ts.isInterfaceDeclaration(statement) && isExported(statement)) addSymbol(statement.name.text, 'interface', statement, 'typescript.exported-interface')
      else if (ts.isTypeAliasDeclaration(statement) && isExported(statement)) addSymbol(statement.name.text, 'type', statement, 'typescript.exported-type')
      else if (ts.isVariableStatement(statement) && isExported(statement)) for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer
        if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) && ts.isIdentifier(declaration.name)) addSymbol(declaration.name.text, 'function', declaration, 'typescript.exported-function-value')
      }
      if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.expression.kind === ts.SyntaxKind.ImportKeyword && statement.expression.arguments[0] && ts.isStringLiteral(statement.expression.arguments[0])) addRef(statement.expression.arguments[0].text, statement.expression.arguments[0].getStart(source), 'typescript.dynamic-import')
    }
    source.forEachChild(function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) addRef(node.arguments[0].text, node.arguments[0].getStart(source), 'commonjs.require')
      ts.forEachChild(node, visit)
    })
    fileParses.push({ path: input.path, hash, fileId, refs })
    }

    if (nextDetected) {
      const appMatch = /^(.*?)(?:^|\/)(?:src\/)?app\/(.*)$/.exec(input.path)
      const pagesMatch = /^(.*?)(?:^|\/)(?:src\/)?pages\/(.*)$/.exec(input.path)
      const leaf = basename(input.path).replace(/\.[^.]+$/, '')
      if (appMatch && ['page', 'route'].includes(leaf)) {
        const route = routePath(input.path, input.path.slice(0, input.path.indexOf('/app/') + 4))
        const routeId = stableId('next-route', input.path)
        const isHandler = leaf === 'route'
        const httpMethods = source.statements.flatMap((statement) => {
          if (ts.isFunctionDeclaration(statement) && statement.name && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(statement.name.text)) return [statement.name.text]
          if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.flatMap((declaration) => ts.isIdentifier(declaration.name) && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(declaration.name.text) ? [declaration.name.text] : [])
          return []
        })
        const routeName = isHandler ? `${httpMethods.join(', ') || 'HTTP handler'} ${route}` : `Page ${route}`
        const endpoint: Element = { id: routeId, kind: 'api-endpoint', name: routeName, description: `${isHandler ? 'Next.js route handler' : 'Next.js App Router page'} inferred from the app directory convention.`, path: input.path, status: 'observed', tags: ['Next.js', isHandler ? 'route-handler' : 'page-route'], x: fileElement.x + 14, y: fileElement.y + 95, source: sourceEvidence(input.path, hash, 1, isHandler ? 'next.app-route-handler' : 'next.app-page', 'Route role was identified from its App Router path.') }
        model.elements.push(endpoint)
        model.relationships.push({ id: stableId('route-file', input.path), fromId: routeId, toId: fileId, kind: 'routes-to', label: route, status: 'observed', source: endpoint.source })
        const record = recordLookup.get(input.path)
        if (record) record.elementIds.push(routeId)
      } else if (pagesMatch && !['_app', '_document', '_error'].includes(leaf)) {
        const routeName = pagesMatch[2].replace(/\.[^.]+$/, '').replace(/(^|\/)index$/, '').replace(/\[(\.\.\.)?([^\]]+)\]/g, (_match, rest: string | undefined, name: string) => rest ? `*${name}` : `:${name}`)
        const route = `/${routeName}`.replace(/\/$/, '') || '/'
        const routeId = stableId('next-route', input.path)
        const isApi = routeName === 'api' || routeName.startsWith('api/')
        const endpoint: Element = { id: routeId, kind: 'api-endpoint', name: `${isApi ? 'API route' : 'Page'} ${route}`, description: `Next.js Pages Router ${isApi ? 'API handler' : 'route'} identified by its file path.`, path: input.path, status: 'observed', tags: ['Next.js', isApi ? 'api-route' : 'pages-router'], x: fileElement.x + 14, y: fileElement.y + 95, source: sourceEvidence(input.path, hash, 1, 'next.pages-router', 'Route role was identified from its Pages Router path.') }
        model.elements.push(endpoint)
        model.relationships.push({ id: stableId('route-file', input.path), fromId: routeId, toId: fileId, kind: 'routes-to', label: route, status: 'observed', source: endpoint.source })
        const record = recordLookup.get(input.path)
        if (record) record.elementIds.push(routeId)
      }
    }
  }

  model.elements.push(...fileElements)
  const referenceTotal = fileParses.reduce((total, file) => total + file.refs.length, 0)
  let referencesResolved = 0
  let importEdgeCount = 0
  let importLimitNoted = false
  for (const file of fileParses) {
    const scopedConfig = [...tsConfigs].filter((config) => {
      const configDirectory = dirname(config.path)
      return !configDirectory || file.path === configDirectory || file.path.startsWith(`${configDirectory}/`)
    }).sort((a, b) => dirname(b.path).length - dirname(a.path).length)[0]
    const configCompiler = scopedConfig?.compilerOptions ?? {}
    const configDirectory = dirname(scopedConfig?.path ?? 'tsconfig.json')
    const aliasBase = normalizePath(configDirectory ? `${configDirectory}/${configCompiler.baseUrl ?? '.'}` : configCompiler.baseUrl ?? '.')
    const aliases = Object.entries(configCompiler.paths ?? {}).map(([pattern, targets]) => ({ pattern, targets, base: aliasBase }))
    for (const reference of file.refs) {
      referencesResolved++
      if (referencesResolved % 100 === 0 || referencesResolved === referenceTotal) progress(request.requestId, 'resolving local module references', referencesResolved, referenceTotal, file.path)
      const target = resolveLocal(reference.specifier, file.path, knownPaths, aliases)
      if (!target) {
        if (reference.specifier.startsWith('.') || reference.specifier.startsWith('/')) warnings.push({ path: file.path, code: 'unresolved-import', message: `Could not resolve local import "${reference.specifier}".` })
        continue
      }
      const toId = sourceElementIds.get(target)
      if (!toId) continue
      if (importEdgeCount >= MAX_IMPORT_EDGES) {
        if (!importLimitNoted) warnings.push({ path: file.path, code: 'import-edge-limit-reached', message: `The local model reached its ${MAX_IMPORT_EDGES.toLocaleString()} resolved-import edge limit; additional import edges were skipped.` })
        importLimitNoted = true
        continue
      }
      importEdgeCount++
      const edgeId = stableId('import', `${file.path}:${reference.order}:${reference.specifier}`)
      const evidence = sourceEvidence(file.path, file.hash, reference.line, reference.rule, `Static module reference to ${reference.specifier}.`)
      model.relationships.push({ id: edgeId, fromId: file.fileId, toId, kind: 'imports', label: reference.specifier, status: 'observed', source: evidence })
    }
  }

  let dependencyEdgeCount = 0
  let dependencyLimitNoted = false
  dependencyLoop: for (const [manifestPath, pkg] of dependencySet) {
    const pkgId = stableId('package', manifestPath)
    for (const dependency of [...pkg.dependencies].sort().slice(0, 200)) {
      if (dependencyEdgeCount >= MAX_DEPENDENCY_EDGES) {
        if (!dependencyLimitNoted) warnings.push({ path: manifestPath, code: 'dependency-limit-reached', message: `The local model reached its ${MAX_DEPENDENCY_EDGES.toLocaleString()} declared-dependency edge limit; additional package edges were skipped.` })
        dependencyLimitNoted = true
        break dependencyLoop
      }
      dependencyEdgeCount++
      const depId = stableId('external-package', dependency)
      if (!model.elements.some((element) => element.id === depId)) model.elements.push({ id: depId, kind: 'external-system', name: dependency, description: 'Declared in a local package.json; runtime use is not asserted.', path: '', status: 'observed', tags: ['npm-dependency'], x: 760 + (model.elements.length % 4) * 185, y: 65 + (model.elements.length % 6) * 100, source: sourceEvidence(manifestPath, hashes.get(manifestPath) ?? '', 1, 'package.dependency', 'Dependency declared by package.json.') })
      model.relationships.push({ id: stableId('package-dependency', `${manifestPath}:${dependency}`), fromId: pkgId, toId: depId, kind: 'depends-on', label: 'declared dependency', status: 'observed', source: sourceEvidence(manifestPath, hashes.get(manifestPath) ?? '', 1, 'package.dependency', 'Dependency declared by package.json.') })
    }
  }

  const frameworks = new Set<string>()
  for (const pkg of dependencySet.values()) for (const name of pkg.dependencies) if (['next', 'react', 'vite', 'express', 'mongoose', 'redis', '@reduxjs/toolkit', 'zustand'].includes(name)) frameworks.add(({ next: 'Next.js', react: 'React', vite: 'Vite', express: 'Express', mongoose: 'Mongoose', redis: 'Redis', '@reduxjs/toolkit': 'Redux Toolkit', zustand: 'Zustand' } as Record<string, string>)[name])
  if (nextDetected) frameworks.add('Next.js')
  const sortedHashes = [...hashes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([path, hash]) => `${path}:${hash}`).join('\n')
  const fingerprint = await sha256(sortedHashes)
  progress(request.requestId, 'reviewing cache, database, and browser storage patterns', 0, request.files.length)
  const findings = analyzeStack(request.files.filter((file) => CODE_EXTENSIONS.includes(extension(file.path))).map((file) => ({ path: file.path, text: file.text, hash: hashes.get(file.path) ?? '', elementId: sourceElementIds.get(file.path) ?? '' })).filter((file) => !!file.elementId))
  const snapshot: RepositorySnapshot = {
    rootName: request.rootName,
    importedAt: new Date().toISOString(),
    fingerprint,
    analyzerVersion: ANALYZER,
    profile: { extensions: CODE_EXTENSIONS, ignoredDirectories: ['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', 'vendor', '.turbo', 'out', 'target'], excludedSecretFiles: request.excludedSecretFiles, sizeLimitBytes: 2 * 1024 * 1024, elementLimit: MAX_ELEMENTS, symbolLimit: MAX_SYMBOLS, importEdgeLimit: MAX_IMPORT_EDGES, dependencyEdgeLimit: MAX_DEPENDENCY_EDGES },
    files: [...records].sort((a, b) => a.path.localeCompare(b.path)),
    warnings: warnings.slice(0, 5000),
    frameworks: [...frameworks].sort(),
    packageManager,
    findings,
  }
  return { model, snapshot }
}

self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
  const request = event.data
  if (!request || request.type !== 'analyze') return
  analyze(request).then(({ model, snapshot }) => {
    self.postMessage({ type: 'complete', requestId: request.requestId, model, snapshot } satisfies AnalysisResponse)
  }).catch((error: unknown) => {
    self.postMessage({ type: 'error', requestId: request.requestId, message: error instanceof Error ? error.message : 'The local analyzer could not finish.' } satisfies AnalysisResponse)
  })
}
