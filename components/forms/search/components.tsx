"use client";
import { HTMLMotionProps } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Slot } from "radix-ui";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { motion } from "motion/react";
import { Schema } from "effect";
import {
  useId,
  useTransition,
  useActionState,
  ComponentPropsWithRef,
  useEffect,
} from "react";
import { redirectToSearch } from "./actions";
import { useSearchForm, SearchContext, useSearch } from "./useSearch";
import { SearchSchema, fromSearchParams, toSearchParams } from "./schema";
import { mergeRefs } from "react-merge-refs";

type RootProps = Omit<
  Slot.SlotProps &
  HTMLMotionProps<"form"> & {
    asChild?: boolean;
  },
  "onSubmit" | "action" | "id"
>;
export const Root = ({ asChild, children, ...props }: RootProps) => {
  const searchParams = useSearchParams();
  const searchParamsData = fromSearchParams(searchParams);
  const router = useRouter();
  const [_, action, _isPending] = useActionState(redirectToSearch, null);
  const [isPending, startTransition] = useTransition();
  const isActuallyPending = isPending || _isPending;
  const id = useId();
  const methods = useForm({
    resolver: effectTsResolver(SearchSchema),
    disabled: isActuallyPending,
    values: searchParamsData,
  });

  const handleSubmit = methods.handleSubmit((data) => {
    const searchParams = toSearchParams(data);
    startTransition(() => {
      window.location.href = `/search?${searchParams.toString()}`;
    });
  });

  const Form = asChild ? Slot.Root : motion.form;

  const values = methods.watch();

  useEffect(() => {
    const data = Schema.decodeSync(SearchSchema)(values);
    const newSearchParams = toSearchParams(data);
    const currentSearchParams = toSearchParams(searchParamsData);
    if (newSearchParams.toString() === currentSearchParams.toString()) return;
    if (newSearchParams.size > 0) {
      router.replace(`/search?${newSearchParams.toString()}`);
    } else {
      router.replace(`/search`);
    }
  }, [values, searchParamsData]);

  useEffect(() => {
    methods.setFocus("q");
  }, []);

  return (
    <SearchContext.Provider
      value={[
        {
          id,
          isPending: isActuallyPending,
        },
        {
          startTransition,
        },
      ]}
    >
      <FormProvider {...methods}>
        <Form {...props} id={id} action={action} onSubmit={handleSubmit}>
          {children}
        </Form>
      </FormProvider>
    </SearchContext.Provider>
  );
};

type QueryInputProps = Omit<
  Slot.SlotProps &
  HTMLMotionProps<"input"> &
  ComponentPropsWithRef<"input"> & {
    asChild?: boolean;
  },
  "id" | "disabled" | "value" | "onChange" | "type"
>;
export const QueryInput = ({ asChild, ref, ...props }: QueryInputProps) => {
  const methods = useSearchForm();
  const [{ id: _id }] = useSearch();
  const Input = asChild ? Slot.Root : motion.input;

  return (
    <Controller
      control={methods.control}
      name="q"
      render={({ field: { ref: _ref, ...field } }) => {
        const mergedRef = mergeRefs([_ref, ref]);
        return (
          <Input
            {...props}
            {...field}
            data-value={field.value || undefined}
            type="search"
            id={`${_id}:q`}
            ref={mergedRef}
          />
        );
      }}
    />
  );
};

type QueryLabelProps = Omit<
  Slot.SlotProps &
  HTMLMotionProps<"label"> & {
    asChild?: boolean;
  },
  "htmlFor"
>;
export const QueryLabel = ({
  asChild,
  children,
  ...props
}: QueryLabelProps) => {
  const [{ id: _id }] = useSearch();
  const Label = asChild ? Slot.Root : motion.label;

  return (
    <Label {...props} htmlFor={`${_id}:q`}>
      {children}
    </Label>
  );
};

type ResetQueryButtonProps = Omit<
  Slot.SlotProps &
  HTMLMotionProps<"button"> & {
    asChild?: boolean;
  },
  "onClick" | "type"
>;
export const ResetQueryButton = ({
  asChild,
  children,
  ...props
}: ResetQueryButtonProps) => {
  const Button = asChild ? Slot.Root : motion.button;
  const methods = useSearchForm();

  return (
    <Button
      {...props}
      type="button"
      disabled={methods.formState.disabled}
      onClick={() => {
        methods.setValue("q", "");
        methods.setFocus("q");
      }}
    >
      {children}
    </Button>
  );
};
