import { Button, DragHandle, Table, TableBody, TableCell, TableHead, TableRow } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { TextInput } from '@contentful/f36-forms';
import { v4 as uuid } from 'uuid';
import { useEffect, useState } from 'react';
import tokens from '@contentful/f36-tokens';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { css } from 'emotion';

interface FieldProps {
  sdk: FieldAppSDK;
}

/** An Item which represents an list item of the repeater app */
interface Item {
  id: string;
  key: string;
  value: string;
}

const styles = {
  row: css({
    position: 'relative',
  }),
};

/** A simple utility function to create a 'blank' item
* @returns A blank `Item` with a uuid
*/
function createItem(): Item {
  return {
    id: uuid(),
    key: '',
    value: '',
  };
}

interface DraggableTableRowProps {
  item: Item;
  onUpdate: (updates: Partial<Item>) => void;
  onRemove: () => void;
}

function DraggableTableRow({ item, onUpdate, onRemove }: DraggableTableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={styles.row}>
      <TableCell>
        <DragHandle label="Reorder item" {...attributes} {...listeners} variant="transparent" style={{ paddingTop: "10px" }} />
      </TableCell>
      <TableCell width="50%">
        <TextInput
          id={`key-${item.id}`}
          name="key"
          value={item.key}
          onChange={(e) => onUpdate({ key: e.target.value })}
        />
      </TableCell>
      <TableCell width="50%">
        <TextInput
          id={`value-${item.id}`}
          name="value"
          value={item.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
      </TableCell>
      <TableCell align="right">
        <Button onClick={onRemove}>Remove item</Button>
      </TableCell>
    </TableRow>
  );
}

const Field = (props: FieldProps) => {
  const sdk = useSDK<FieldAppSDK>();
  const [items, setItems] = useState<Item[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const value = sdk.field.getValue();
    if (Array.isArray(value)) {
      setItems(value);
      sdk.window.startAutoResizer();
    }
  }, []);

  const updateState = (newItems: Item[]) => {
    setItems(newItems);
    sdk.field.setValue(newItems);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      updateState(arrayMove(items, oldIndex, newIndex));
    }
  };

  const addItem = () => updateState([...items, createItem()]);
  
  const removeItem = (item: Item) => updateState(items.filter(i => i.id !== item.id));

  const updateItem = (item: Item, updates: Partial<Item>) => {
    const index = items.findIndex(i => i.id === item.id);
    if (index === -1) return;
    
    const newItems = [...items];
    newItems[index] = { ...item, ...updates };
    updateState(newItems);
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <DraggableTableRow
                  key={item.id}
                  item={item}
                  onUpdate={(updates) => updateItem(item, updates)}
                  onRemove={() => removeItem(item)}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>

      <div style={{ paddingTop: tokens.spacingM }}>
        <Button onClick={addItem} variant="secondary">
          Add item
        </Button>
      </div>
    </>
  );
};

export default Field;
