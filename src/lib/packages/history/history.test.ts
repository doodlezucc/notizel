import { expect, test, vi } from 'vitest';
import { type ChangeDescription, ChangeHistory, type DoContext } from './history';

test('Run history thingy', () => {
	const history = new ChangeHistory();

	const changeUndo = vi.fn();
	const changeDo = vi.fn(() => {
		const payload = 'unique-id';

		return () => {
			changeUndo(payload);
		};
	});

	history.execute('Add thing', changeDo);

	expect(changeDo).toHaveBeenCalledExactlyOnceWith<[DoContext]>({ isRedo: false });
	expect(changeUndo).not.toHaveBeenCalled();

	expect(history.undo()).toEqual<ChangeDescription>({ message: 'Add thing' });
	expect(history.undo()).toBeNull();

	expect(changeDo).toHaveBeenCalledOnce();
	expect(changeUndo).toHaveBeenCalledExactlyOnceWith('unique-id');

	expect(history.redo()).toEqual<ChangeDescription>({ message: 'Add thing' });
	expect(history.redo()).toBeNull();

	expect(changeDo).toHaveBeenCalledTimes(2);
	expect(changeDo).toHaveBeenLastCalledWith<[DoContext]>({ isRedo: true });
	expect(changeUndo).toHaveBeenCalledOnce();
});
