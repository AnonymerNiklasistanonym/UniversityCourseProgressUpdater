// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const sum = <ELEMENT_TYPE extends unknown>(
  array: ReadonlyArray<ELEMENT_TYPE>,
  counter: (element: Readonly<ELEMENT_TYPE>) => number
): number => array.reduce((sum, element) => sum + counter(element), 0);

export const merge = <
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  INPUT_ELEMENT_TYPE extends unknown,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  OUTPUT_ELEMENT_TYPE extends unknown
>(
  array: ReadonlyArray<INPUT_ELEMENT_TYPE>,
  converter: (element: Readonly<INPUT_ELEMENT_TYPE>) => OUTPUT_ELEMENT_TYPE
): OUTPUT_ELEMENT_TYPE[] =>
  array.reduce(
    (outputArray, element) => outputArray.concat([converter(element)]),
    [] as OUTPUT_ELEMENT_TYPE[]
  );

/**
 * Predicate with type guard that can be inserted into a filter() call to remove
 * undefined values from the array.
 * @param value Any value.
 * @returns True if not undefined.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const notUndefined = <T extends unknown>(value?: Readonly<T>): value is T =>
  value !== undefined;

/**
 * Help cleaning up a list with undefined values
 * @param argumentsList Arguments that are possibly undefined
 * @param functionIfNotEmpty Function that is executed if list contains any not undefined elements
 * @returns Either undefined if list is empty or the result of the function
 */
export const cleanupUndefinedList = <
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  INPUT_ELEMENT_TYPE extends unknown,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  OUTPUT_ELEMENT_TYPE extends unknown
>(
  argumentsList: ReadonlyArray<INPUT_ELEMENT_TYPE | undefined>,
  functionIfNotEmpty: (
    a: ReadonlyArray<INPUT_ELEMENT_TYPE>
  ) => OUTPUT_ELEMENT_TYPE
): OUTPUT_ELEMENT_TYPE | undefined => {
  const newList = argumentsList.filter<INPUT_ELEMENT_TYPE>(notUndefined);
  return newList.length === 0 ? undefined : functionIfNotEmpty(newList);
};
