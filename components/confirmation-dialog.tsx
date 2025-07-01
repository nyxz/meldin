'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Variant styles
  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
      confirmButton: "bg-red-500 hover:bg-red-600 text-white",
      title: "text-red-400"
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      confirmButton: "bg-amber-500 hover:bg-amber-600 text-white",
      title: "text-amber-400"
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-blue-400" />,
      confirmButton: "bg-blue-500 hover:bg-blue-600 text-white",
      title: "text-blue-400"
    }
  };

  const styles = variantStyles[variant];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-gray-100">
        <DialogHeader className="flex flex-row items-center gap-4">
          <div className="p-2 rounded-full bg-gray-800">
            {styles.icon}
          </div>
          <div>
            <DialogTitle className={`text-xl ${styles.title}`}>{title}</DialogTitle>
            <DialogDescription className="text-gray-400 mt-1">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          <div className="flex gap-3 w-full justify-end">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-700 hover:bg-gray-800 hover:text-gray-100"
            >
              {cancelText}
            </Button>
            <Button 
              onClick={handleConfirm}
              className={styles.confirmButton}
            >
              {confirmText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}