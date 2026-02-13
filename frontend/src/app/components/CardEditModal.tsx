'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/types';
import { Button } from './Button';
import { Input } from './Input';

interface CardEditModalProps {
  card: Card;
  onClose: () => void;
  onSave: (updatedCard: {
    title: string;
    description: string;
    dueDate: string | undefined;
    tags: string[] | undefined;
  }) => void;
}

export default function CardEditModal({
  card,
  onClose,
  onSave,
}: CardEditModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.split('T')[0] : '',
  );
  const [tagsInput, setTagsInput] = useState(
    card.tags ? card.tags.join(', ') : '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[#F5F5DC] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Card</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Title *
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                placeholder="Card title"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Add a description..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDueDate(e.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-bold mb-2 text-gray-800"
              >
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagsInput(e.target.value)
                }
                placeholder="bug, feature, urgent"
              />
              <p className="text-sm text-gray-700 mt-1">
                Separate tags with commas
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
