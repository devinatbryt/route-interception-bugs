import { Schema } from "effect";
import {
  objectToFormData,
  formDataToNestedObject,
  searchParamsToNestedObject,
  objectToSearchParams,
} from "../utils";

export const SearchSchema = Schema.Struct({
  q: Schema.String.pipe(
    Schema.optionalWith({
      default: () => "",
    }),
  ),
}).pipe(Schema.asSchema);

export const FormDataSchema = Schema.transform(
  Schema.instanceOf(FormData),
  SearchSchema,
  {
    strict: true,
    encode: objectToFormData,
    decode: formDataToNestedObject,
  },
);

export const SearchParamsSchema = Schema.transform(
  Schema.instanceOf(URLSearchParams),
  SearchSchema,
  {
    encode: objectToSearchParams,
    decode: searchParamsToNestedObject,
  },
);

export const RequestSchema = Schema.transform(
  Schema.instanceOf(FormData),
  SearchSchema,
  {
    strict: false,
    encode: objectToFormData,
    decode: formDataToNestedObject,
  },
);

export const toFormData = (data: typeof SearchSchema.Type) =>
  Schema.encodeSync(FormDataSchema)(data);
export const fromFormData = (data: FormData) =>
  Schema.decodeSync(FormDataSchema)(data);

export const toSearchParams = (data: typeof SearchSchema.Type) =>
  Schema.encodeSync(SearchParamsSchema)(data);
export const fromSearchParams = (data: URLSearchParams) =>
  Schema.decodeSync(SearchParamsSchema)(data);
