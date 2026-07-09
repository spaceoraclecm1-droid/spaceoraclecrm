import React from 'react';
import { InquiryRemark } from '../types/inquiry';

interface RemarksHistoryProps {
  remarks: InquiryRemark[];
  onEditRemark?: (remarkId: string, newText: string) => void;
  onDeleteRemark?: (remarkId: string) => void;
  isEditable?: boolean;
}

const RemarksHistory: React.FC<RemarksHistoryProps> = ({
  remarks,
  onEditRemark,
  onDeleteRemark,
  isEditable = false,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');

  const handleEditStart = (remark: InquiryRemark) => {
    setEditingId(remark.id);
    setEditText(remark.remark);
  };

  const handleEditSave = (remarkId: string) => {
    if (editText.trim() && onEditRemark) {
      onEditRemark(remarkId, editText);
    }
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Remarks History</h2>
      <div className="space-y-4">
        {remarks.map((remark) => (
          <div
            key={remark.id}
            className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {editingId === remark.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full border rounded p-2"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditSave(remark.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-700">{remark.remark}</p>
                  {isEditable && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStart(remark)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteRemark?.(remark.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>By: {remark.createdBy}</span>
                  <span>{remark.createdAt.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {remarks.length === 0 && (
          <p className="text-gray-500 text-center py-4">No remarks yet</p>
        )}
      </div>
    </div>
  );
};

export default RemarksHistory; 