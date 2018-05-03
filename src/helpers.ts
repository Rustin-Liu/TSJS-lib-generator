import * as Browser from "./types";

// Extended types used but not defined in the spec
export const bufferSourceTypes = new Set(["ArrayBuffer", "ArrayBufferView", "DataView", "Int8Array", "Uint8Array", "Int16Array", "Uint16Array", "Uint8ClampedArray", "Int32Array", "Uint32Array", "Float32Array", "Float64Array"]);
export const integerTypes = new Set(["byte", "octet", "short", "unsigned short", "long", "unsigned long", "long long", "unsigned long long"]);
export const stringTypes = new Set(["ByteString", "DOMString", "USVString"]);
const floatTypes = new Set(["float", "unrestricted float", "double", "unrestricted double"]);
const sameTypes = new Set(["any", "boolean", "Date", "Function", "Promise", "void"]);
export const baseTypeConversionMap = new Map<string, string>([
    ...[...bufferSourceTypes].map(type => [type, type] as [string, string]),
    ...[...integerTypes].map(type => [type, "number"] as [string, string]),
    ...[...floatTypes].map(type => [type, "number"] as [string, string]),
    ...[...stringTypes].map(type => [type, "string"] as [string, string]),
    ...[...sameTypes].map(type => [type, type] as [string, string]),
    ["object", "any"],
    ["sequence", "Array"],
    ["record", "Record"],
    ["FrozenArray", "ReadonlyArray"],
    ["WindowProxy", "Window"],
    ["EventHandler", "EventHandler"]
]);

export function filter(obj: any, fn: (o: any, n: string | undefined) => boolean): any {
    if (typeof obj === "object") {
        if (Array.isArray(obj)) {
            return mapDefined(obj, e => fn(e, undefined) ? filter(e, fn) : undefined);
        }
        else {
            const result: any = {};
            for (const e in obj) {
                if (fn(obj[e], e)) {
                    result[e] = filter(obj[e], fn);
                }
            }
            return result;
        }
    }
    return obj;
}

export function filterProperties<T>(obj: Record<string, T>, fn: (o: T) => boolean): Record<string, T> {
    const result: Record<string, T> = {};
    for (const e in obj) {
        if (fn(obj[e])) {
            result[e] = obj[e];
        }
    }
    return result;
}

export function exposesTo(o: { exposed?: string }, target: string) {
    if (!o || typeof o.exposed !== "string") {
        return true;
    }
    return o.exposed.includes(target);
}

export function merge<T>(src: T, target: T, shallow?: boolean): T {
    if (typeof src !== "object" || typeof target !== "object") {
        return target;
    }
    for (const k in target) {
        if (Object.getOwnPropertyDescriptor(target, k)) {
            if (Object.getOwnPropertyDescriptor(src, k)) {
                const srcProp = src[k];
                const targetProp = target[k];
                if (Array.isArray(srcProp) && Array.isArray(targetProp)) {
                    mergeNamedArrays(srcProp, targetProp);
                }
                else {
                    if (Array.isArray(srcProp) !== Array.isArray(targetProp)) {
                        throw new Error("Mismatch on property: " + k + JSON.stringify(targetProp));
                    }
                    if (shallow && typeof (src[k] as any).name === "string" && typeof (target[k] as any).name === "string") {
                        src[k] = target[k];
                    }
                    else {
                        src[k] = merge(src[k], target[k], shallow);
                    }
                }
            }
            else {
                src[k] = target[k];
            }
        }
    }
    return src;
}

function mergeNamedArrays<T extends { name: string; "new-type": string; }>(srcProp: T[], targetProp: T[]) {
    const map: any = {};
    for (const e1 of srcProp) {
        const name = e1.name || e1["new-type"];
        if (name) {
            map[name] = e1;
        }
    }

    for (const e2 of targetProp) {
        const name = e2.name || e2["new-type"];
        if (name && map[name]) {
            merge(map[name], e2);
        }
        else {
            srcProp.push(e2);
        }
    }
}

export function distinct<T>(a: T[]): T[] {
    return Array.from(new Set(a).values());
}

export function mapToArray<T>(m: Record<string, T>): T[] {
    return Object.keys(m || {}).map(k => m[k]);
}

export function arrayToMap<T, U>(array: ReadonlyArray<T>, makeKey: (value: T) => string, makeValue: (value: T) => U): Record<string, U> {
    const result: Record<string, U> = {};
    for (const value of array) {
        result[makeKey(value)] = makeValue(value);
    }
    return result;
}

export function map<T, U>(obj: Record<string, T> | undefined, fn: (o: T) => U): U[] {
    return Object.keys(obj || {}).map(k => fn(obj![k]));
}

export function mapDefined<T, U>(array: ReadonlyArray<T> | undefined, mapFn: (x: T, i: number) => U | undefined): U[] {
    const result: U[] = [];
    if (array) {
        for (let i = 0; i < array.length; i++) {
            const mapped = mapFn(array[i], i);
            if (mapped !== undefined) {
                result.push(mapped);
            }
        }
    }
    return result;
}

export function toNameMap<T extends { name: string }>(array: T[]) {
    const result: Record<string, T> = {};
    for (const value of array) {
        result[value.name] = value;
    }
    return result;
}

export function isArray(value: any): value is ReadonlyArray<{}> {
    return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

export function flatMap<T, U>(array: ReadonlyArray<T> | undefined, mapfn: (x: T, i: number) => U | ReadonlyArray<U> | undefined): U[] {
    let result: U[] | undefined;
    if (array) {
        result = [];
        for (let i = 0; i < array.length; i++) {
            const v = mapfn(array[i], i);
            if (v) {
                if (isArray(v)) {
                    result.push(...v);
                }
                else {
                    result.push(v);
                }
            }
        }
    }
    return result || [];
}

export function concat<T>(a: T[] | undefined, b: T[] | undefined): T[] {
    return !a ? b || [] : a.concat(b || []);
}

export function getEmptyWebIDL(): Browser.WebIdl {
    return {
        "callback-functions": {
            "callback-function": {}
        },
        "callback-interfaces": {
            "interface": {}
        },
        "dictionaries": {
            "dictionary": {}
        },
        "enums": {
            "enum": {}
        },
        "interfaces": {
            "interface": {}
        },
        "mixins": {
            "mixin": {}
        },
        "typedefs": {
            "typedef": []
        }
    }
}

export function resolveExposure(obj: any, exposure: string, override?: boolean) {
    if (!exposure) {
        throw new Error("No exposure set");
    }
    if ("exposed" in obj && (override || obj.exposed === undefined)) {
        obj.exposed = exposure;
    }
    for (const key in obj) {
        if (typeof obj[key] === "object") {
            resolveExposure(obj[key], exposure, override);
        }
    }
}

function collectTypeReferences(obj: any): string[] {
    const collection: string[] = [];
    if (typeof obj !== "object") {
        return collection;
    }
    if (Array.isArray(obj)) {
        return collection.concat(...obj.map(collectTypeReferences));
    }

    if (typeof obj.type === "string") {
        collection.push(obj.type);
    }
    if (Array.isArray(obj.implements)) {
        collection.push(...obj.implements);
    }
    if (typeof obj.extends === "string") {
        collection.push(obj.extends);
    }

    for (const e in obj) {
        collection.push(...collectTypeReferences(obj[e]));
    }
    return collection;
}

function getNonValueTypeMap(webidl: Browser.WebIdl) {
    const namedTypes: { name: string }[] = [
        ...mapToArray(webidl["callback-functions"]!["callback-function"]),
        ...mapToArray(webidl["callback-interfaces"]!.interface),
        ...mapToArray(webidl.dictionaries!.dictionary),
        ...mapToArray(webidl.enums!.enum),
        ...mapToArray(webidl.mixins!.mixin)
    ];
    const map = new Map(namedTypes.map(t => [t.name, t] as [string, any]));
    webidl.typedefs!.typedef.map(typedef => map.set(typedef["new-type"], typedef));
    return map;
}

export function followTypeReferences(webidl: Browser.WebIdl, filteredInterfaces: Record<string, Browser.Interface>) {
    const set = new Set<string>();
    const map = getNonValueTypeMap(webidl);

    new Set(collectTypeReferences(filteredInterfaces)).forEach(follow);
    return set;

    function follow(reference: string) {
        if (baseTypeConversionMap.has(reference) ||
            reference in filteredInterfaces) {
            return;
        }
        const type = map.get(reference);
        if (!type) {
            return;
        }
        if (!set.has(type.name || type["new-type"])) {
            set.add(type.name || type["new-type"]);
            collectTypeReferences(type).forEach(follow);
        }
    }
}

export function markAsDeprecated(i: Browser.Interface) {
    for (const method of mapToArray(i.methods.method)) {
        method.deprecated = 1;
    }
    for (const property of mapToArray(i.properties!.property)) {
        property.deprecated = 1;
    }
}
