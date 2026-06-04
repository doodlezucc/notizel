export interface DoContext {
	isRedo: boolean;
}

export type Change = (context: DoContext) => () => void;

export interface ChangeDescription {
	message: string;
}

interface Commit {
	message: string;
	change: Change;
	revert(): void;
}

interface PlannedChange {
	message: string;
	change: Change;
}

export class ChangeHistory {
	private pastCommits: Commit[] = [];
	private futureCommits: PlannedChange[] = [];

	get canUndo() {
		return this.pastCommits.length > 0;
	}

	get canRedo() {
		return this.futureCommits.length > 0;
	}

	execute(message: string, change: Change) {
		console.log(message);
		const revert = change({ isRedo: false });
		this.pastCommits.push({ message, change, revert });

		// Clear redo stack
		this.futureCommits = [];
	}

	undo(): ChangeDescription | null {
		const lastCommit = this.pastCommits.pop();

		if (lastCommit === undefined) {
			return null;
		}

		lastCommit.revert();
		this.futureCommits.unshift(lastCommit);

		return { message: lastCommit.message };
	}

	redo(): ChangeDescription | null {
		const commit = this.futureCommits.shift();

		if (commit === undefined) {
			return null;
		}

		const revert = commit.change({ isRedo: true });
		this.pastCommits.push({ ...commit, revert });

		return { message: commit.message };
	}
}
