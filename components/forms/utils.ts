type EncodedValue = Record<string, unknown>;

const segmentsToBracketKey = (segments: (string | number)[]): string => {
  const [head, ...rest] = segments.map(String);
  if (!head) return "";
  return head + rest.map((segment) => `[${segment}]`).join("");
};

const AUTO = Symbol("auto");

type PathSegment = string | number | typeof AUTO;

const parseBracketKey = (key: string): PathSegment[] => {
  const segments: PathSegment[] = [];
  const re = /([^[\]]+)|\[(.*?)\]/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(key)) !== null) {
    if (match[1] !== undefined) {
      // first "bare" part before any brackets: items
      segments.push(match[1]);
    } else {
      const content = match[2] ?? "";
      if (content === "") {
        // "[]"
        segments.push(AUTO);
      } else if (/^\d+$/.test(content)) {
        // "[0]" -> 0
        segments.push(Number(content));
      } else {
        // "[properties]" -> "properties"
        segments.push(content);
      }
    }
  }

  return segments;
};

type ObjectPath = (string | number)[];

const getPath = (obj: unknown, segments: ObjectPath): unknown => {
  let cur: any = obj;
  for (const seg of segments) {
    if (cur == null) return undefined;
    if (typeof seg === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[seg];
    } else {
      cur = cur[seg];
    }
  }
  return cur;
};

const setNestedValue = (
  root: any,
  segments: PathSegment[],
  value: unknown,
): void => {
  let node: any = root;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    const next = segments[i + 1];

    if (typeof seg === "string") {
      const shouldBeArray = typeof next === "number" || next === AUTO;

      if (!(seg in node)) {
        node[seg] = shouldBeArray ? [] : {};
      }

      if (isLast) {
        node[seg] = value;
        return;
      } else {
        node = node[seg];
      }
    } else if (typeof seg === "number") {
      if (!Array.isArray(node)) {
        // If this ever happens, your form shape is inconsistent.
        node = [];
      }

      if (!node[seg]) {
        const shouldBeArray = typeof next === "number" || next === AUTO;
        node[seg] = shouldBeArray ? [] : {};
      }

      if (isLast) {
        node[seg] = value;
        return;
      } else {
        node = node[seg];
      }
    } else if (seg === AUTO) {
      // node must already be an array (created by previous string segment)
      const arr: any[] = node;

      // remaining *real* path for this array element
      const remaining = segments
        .slice(i + 1)
        .filter((s): s is string | number => s !== AUTO);

      // Find first element where remaining path is still undefined
      let candidateIndex = -1;
      for (let j = 0; j < arr.length; j++) {
        const candidate = arr[j];
        if (getPath(candidate, remaining) === undefined) {
          candidateIndex = j;
          break;
        }
      }

      if (candidateIndex === -1) {
        candidateIndex = arr.length;
        arr.push({});
      }

      if (isLast) {
        // Degenerate case: "items[]" with no sub-path
        arr[candidateIndex] = value;
        return;
      } else {
        node = arr[candidateIndex];
      }
    }
  }
};

type KeyValueEntries = Iterable<[string, any]>;

/**
 * Turn things like:
 *   items[0][properties][key] = "foo"
 *   items[][properties][key] = "bar"
 * into nested JS objects/arrays.
 */
const entriesToNestedObject = (entries: KeyValueEntries): any => {
  const root: any = {};

  for (const [rawKey, rawValue] of entries) {
    const segments = parseBracketKey(rawKey);
    // URLSearchParams is always string values, so this is simple:
    const value = rawValue;
    setNestedValue(root, segments, value);
  }

  return root;
};

export const formDataToNestedObject = (formData: FormData): any =>
  entriesToNestedObject(formData.entries());

export const searchParamsToNestedObject = (params: URLSearchParams): any =>
  entriesToNestedObject(params.entries());

export const objectToFormData = (encoded: EncodedValue): FormData => {
  const fd = new FormData();

  const append = (value: unknown, path: (string | number)[]) => {
    if (value == null) return;

    // Treat arrays separately if you want indices in the path
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        append(item, [...path, index]);
      });
      return;
    }

    if (value instanceof File || value instanceof Blob) {
      const key = segmentsToBracketKey(path);
      fd.append(key, value);
      return;
    }

    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        append(v, [...path, k]);
      }
      return;
    }

    // Primitive (string/number/boolean/etc.)
    const key = segmentsToBracketKey(path);
    fd.append(key, String(value));
  };

  for (const [k, v] of Object.entries(encoded)) {
    append(v, [k]);
  }

  return fd;
};

export const objectToSearchParams = (
  encoded: EncodedValue,
): URLSearchParams => {
  const params = new URLSearchParams();

  const append = (value: unknown, path: (string | number)[]) => {
    if (value == null) return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        // Using numeric indices: items[0][...]
        append(item, [...path, index]);
      });
      return;
    }

    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        append(v, [...path, k]);
      }
      return;
    }

    // Primitive: string/number/boolean/etc.
    const key = segmentsToBracketKey(path);
    params.append(key, String(value));
  };

  for (const [k, v] of Object.entries(encoded)) {
    append(v, [k]);
  }

  return params;
};
