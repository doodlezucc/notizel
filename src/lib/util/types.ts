// Taken from the "Omit_NewAndImproved" type here:
// https://github.com/microsoft/TypeScript/wiki/FAQ#add-a-key-constraint-to-omit
export type OmitFromUnion<T, K extends keyof T> = {
	[P in keyof T as Exclude<P, K>]: T[P];
};
