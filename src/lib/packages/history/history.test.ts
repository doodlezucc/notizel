import { expect, test, vi } from 'vitest';
import { type ChangeDescription, ChangeHistory } from './history';

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

	expect(changeDo).toHaveBeenCalledOnce();
	expect(changeUndo).not.toHaveBeenCalled();

	expect(history.undo()).toEqual<ChangeDescription>({ message: 'Add thing' });
	expect(history.undo()).toBeNull();

	expect(changeDo).toHaveBeenCalledOnce();
	expect(changeUndo).toHaveBeenCalledExactlyOnceWith('unique-id');

	expect(history.redo()).toEqual<ChangeDescription>({ message: 'Add thing' });
	expect(history.redo()).toBeNull();

	expect(changeDo).toHaveBeenCalledTimes(2);
	expect(changeUndo).toHaveBeenCalledOnce();
});
