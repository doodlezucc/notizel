import { Temporal } from 'temporal-polyfill';
import type { ID } from '../common';
import type { Vault } from '../vault';

/** Time since epoch in milliseconds. */
type JsonTimestamp = number;

function instantToJson(instant: Temporal.Instant): JsonTimestamp {
	return instant.epochMilliseconds;
}

function instantFromJson(timestamp: JsonTimestamp): Temporal.Instant {
	return Temporal.Instant.fromEpochMilliseconds(timestamp);
}

interface VaultJson {
	files: VaultFileMetaJson[];
}

interface VaultFileMetaJson {
	id: ID;
	name: string;
	createdAt: JsonTimestamp;
	modifiedAt: JsonTimestamp;
}

export function convertVaultToJson(vault: Vault): VaultJson {
	return {
		files: vault.files.map((file) => ({
			id: file.id,
			name: file.name,
			createdAt: instantToJson(file.createdAt),
			modifiedAt: instantToJson(file.modifiedAt)
		}))
	};
}

export function convertVaultFromJson(vault: VaultJson): Vault {
	return {
		files: vault.files.map((file) => ({
			id: file.id,
			name: file.name,
			createdAt: instantFromJson(file.createdAt),
			modifiedAt: instantFromJson(file.modifiedAt)
		}))
	};
}
