import { useState } from 'preact/hooks';
import { allCategoriesSorted, addCategory, reorderCategories, updateCategory, deleteCategory } from '../lib/store';
import { Button, Card, IconBadge, Input } from '../components/ui';
import type { Category } from '../lib/types';

const SUGGESTED_ICONS = ['🏠', '💡', '🛒', '🍽️', '🚌', '🩺', '🎓', '👨‍👩‍👧', '🎮', '🔁', '🧾', '💼', '💳', '📦', '🐾', '🎁', '✈️', '🏋️'];

function CategoryRow(props: { cat: Category; index: number; total: number }) {
  const { cat } = props;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon);
  const [color, setColor] = useState(cat.color);

  if (editing) {
    return (
      <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        <Input label="Nombre" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`tap-target rounded-lg text-xl ${icon === i ? 'bg-brand-100 dark:bg-brand-900' : ''}`}
            >
              {i}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          Color
          <input type="color" value={color} onInput={(e) => setColor((e.target as HTMLInputElement).value)} className="tap-target w-16 rounded" />
        </label>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={async () => {
              await updateCategory(cat.id, { name, icon, color });
              setEditing(false);
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 py-2 ${cat.hidden ? 'opacity-50' : ''}`}>
      <div className="flex flex-col">
        <button
          disabled={props.index === 0}
          aria-label="Subir"
          className="tap-target text-xs disabled:opacity-20"
          onClick={() => {
            const ids = allCategoriesSorted.value.map((c) => c.id);
            [ids[props.index - 1], ids[props.index]] = [ids[props.index], ids[props.index - 1]];
            reorderCategories(ids);
          }}
        >
          ▲
        </button>
        <button
          disabled={props.index === props.total - 1}
          aria-label="Bajar"
          className="tap-target text-xs disabled:opacity-20"
          onClick={() => {
            const ids = allCategoriesSorted.value.map((c) => c.id);
            [ids[props.index + 1], ids[props.index]] = [ids[props.index], ids[props.index + 1]];
            reorderCategories(ids);
          }}
        >
          ▼
        </button>
      </div>
      <IconBadge icon={cat.icon} color={cat.color} />
      <span className="flex-1 font-medium">{cat.name}</span>
      <Button variant="ghost" className="px-2 text-xs" onClick={() => updateCategory(cat.id, { hidden: !cat.hidden })}>
        {cat.hidden ? 'Mostrar' : 'Ocultar'}
      </Button>
      <Button variant="ghost" className="px-2 text-xs" onClick={() => setEditing(true)}>
        Editar
      </Button>
      <Button
        variant="ghost"
        className="px-2 text-xs text-red-600"
        onClick={() => {
          if (confirm(`Eliminar la categoria "${cat.name}"? Los gastos ya registrados la conservaran como referencia.`)) {
            deleteCategory(cat.id);
          }
        }}
      >
        🗑️
      </Button>
    </div>
  );
}

export function Categorias() {
  const cats = allCategoriesSorted.value;
  const [newName, setNewName] = useState('');

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-28 md:pb-10">
      <h1 className="text-lg font-bold">Categorias</h1>
      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {cats.map((c, i) => (
          <CategoryRow key={c.id} cat={c} index={i} total={cats.length} />
        ))}
      </Card>
      <Card className="flex gap-2">
        <Input placeholder="Nueva categoria" value={newName} onInput={(e) => setNewName((e.target as HTMLInputElement).value)} className="flex-1" />
        <Button
          disabled={!newName.trim()}
          onClick={async () => {
            await addCategory({ name: newName, icon: '📦', color: '#525252' });
            setNewName('');
          }}
        >
          Agregar
        </Button>
      </Card>
    </div>
  );
}
