import { Flag, Sprout, Star } from 'lucide-react';

export const routes = {
  easy: { title: '森林初探', description: '觀察一種變化，找到圖形的小規律。', size: '2 × 2', icon: Sprout, color: 'green', label: '入門' },
  medium: { title: '星光旅程', description: '看看橫列與直欄，串起兩種線索。', size: '3 × 3', icon: Star, color: 'orange', label: '進階' },
  hard: { title: '祕境挑戰', description: '結合三種圖形規律，解開新祕密。', size: '3 × 3', icon: Flag, color: 'purple', label: '挑戰' },
};
