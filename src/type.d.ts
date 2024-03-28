import type { Category } from "./category.js";
import type { TopKQueue } from "./topk-queue.js";
import type { Config } from "./data.js";

export interface IPost {
  id: string;
  title: string;
  date: number;
  updated: number;
  content: string;
  author: string;
  tags: string[];
  related: string[];
  category: string[];
  toc: Item;
}

export interface Item {
  title: string;
  url: string;
  items: Item[];
}

export interface IPostPreview {
  id: string;
  title: string;
  date: number;
  content: string;
  author: string;
  tags: string[];
}

export type Context = {
  root: string;
  queue: TopKQueue<IPost>;
  categories: Category;
} & typeof Config;

export interface IArchive {
  year: number;
  months: (IArchiveMonth | null)[];
  total: number;
}

export interface IArchiveMonth {
  month: number;
  total: number;
  // TODO: sort by date
  posts: IPostPreview[];
}
