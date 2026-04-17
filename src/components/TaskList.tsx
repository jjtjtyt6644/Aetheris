"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Trash2, Circle, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function TaskList({ onClose }: { onClose?: () => void }) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("aetheris_tasks", []);
  const [newTaskText, setNewTaskText] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const toggleTask = (id: string, currentlyCompleted: boolean) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    
    // Play a rewarding "ding" sound when a task is checked off
    if (!currentlyCompleted) {
      const audio = new Audio("https://actions.google.com/sounds/v1/glass/glass_ping.ogg");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  if (!isMounted) {
    return <div className="flex flex-col h-full w-full opacity-0" />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium opacity-70 bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
            {tasks.filter((t) => t.completed).length} / {tasks.length}
          </span>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/5"
              aria-label="Close Tasks"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-50 text-sm text-center">
            No tasks yet.<br/>What will you focus on?
          </div>
        ) : (
          tasks.map((task, i) => (
            <div
              key={task.id || i}
              className={`group flex items-center justify-between p-3 rounded-lg transition-all ${
                task.completed ? "bg-white/5 opacity-50" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <button
                onClick={() => toggleTask(task.id, task.completed)}
                className="flex items-center flex-1 text-left min-w-0"
              >
                {task.completed ? (
                  <Check className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 mr-3 flex-shrink-0 opacity-50" />
                )}
                <span className={`truncate text-sm ${task.completed ? "line-through" : ""}`}>
                  {task.text}
                </span>
              </button>
              
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-md transition-all text-red-300"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addTask} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="glass-input flex-1 text-sm bg-black/20 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          className="glass-button p-2 disabled:opacity-50 flex items-center justify-center shrink-0 w-10 h-10"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
