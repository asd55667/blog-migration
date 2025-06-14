import type { Category } from "./category.js";
import type { TopKQueue } from "./topk-queue.js";
import { Archive } from "./archive.js";
import { Tag } from "./tag.js";

export interface IPost {
  id: string;
  title: string;
  description: string;
  created: number;
  updated: number;
  content: string;
  author: string;
  tags: string[];
  related: string[];
  category: string[];
  toc?: Item;
}

export interface Item {
  title: string;
  url: string;
  items: Item[];
}

export interface IPostPreview {
  id: string;
  title: string;
  created: number;
  description: string;
  content: string;
  author: string;
  tags: string[];
}

export type Context = {
  root: string;
  queue: TopKQueue<IPost>;
  categories: Category;
  archive: Archive;
  tagInstance: Tag;
}

export interface IArchive {
  year: number;
  months: IArchiveMonth[];
  total: number;
}

export interface IArchiveMonth {
  month: number;
  total: number;
  posts: IPostPreview[];
}


export interface IDocNav {
  title: string;
  href: string;
  items?: IDocNav[]
}

export interface IMetadata {
  title: string;
  description: string;
  created: string;
  updated: string;
  author: string;
  tags: string[];
}