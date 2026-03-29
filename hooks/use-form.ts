import Joi from "joi";
import { useCallback, useRef, useState } from "react";

type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, string>>(
  initialValues: T,
  schema: Joi.ObjectSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({});
  const touched = useRef<Set<keyof T>>(new Set());

  const validateField = useCallback(
    (field: keyof T, currentValues: T) => {
      const { error } = schema.validate(currentValues, { abortEarly: false });
      const fieldError = error?.details.find(
        (d) => d.path[0] === field
      )?.message;
      setFieldErrors((prev) => ({ ...prev, [field]: fieldError }));
    },
    [schema]
  );

  const setValue = useCallback(
    (field: keyof T, value: string) => {
      const next = { ...values, [field]: value } as T;
      setValues(next);
      if (touched.current.has(field)) {
        validateField(field, next);
      }
    },
    [values, validateField]
  );

  const onBlur = useCallback(
    (field: keyof T) => {
      touched.current.add(field);
      validateField(field, values);
    },
    [values, validateField]
  );

  const validate = useCallback((): T | null => {
    const { error, value } = schema.validate(values, { abortEarly: false });
    if (!error) {
      setFieldErrors({});
      return value;
    }

    const errors: FieldErrors<T> = {};
    for (const detail of error.details) {
      const key = detail.path[0] as keyof T;
      if (!errors[key]) {
        errors[key] = detail.message;
        touched.current.add(key);
      }
    }
    setFieldErrors(errors);
    return null;
  }, [values, schema]);

  const getError = useCallback(
    (field: keyof T): string | undefined => {
      return touched.current.has(field) ? fieldErrors[field] : undefined;
    },
    [fieldErrors]
  );

  return { values, setValue, onBlur, validate, getError, fieldErrors };
}
