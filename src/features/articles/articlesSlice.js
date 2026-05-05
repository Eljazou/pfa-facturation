import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getArticles, createArticle, updateArticle, deleteArticle,
  getCategories, createCategory, updateCategory, deleteCategory,
} from '../../services/jsonService';

export const fetchArticles = createAsyncThunk('articles/fetchAll', async (_, { rejectWithValue }) => {
  try { return await getArticles(); }
  catch (err) { return rejectWithValue(err.message); }
});

export const addArticle = createAsyncThunk('articles/add', async (data, { rejectWithValue }) => {
  try { return await createArticle(data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const editArticle = createAsyncThunk('articles/edit', async ({ id, data }, { rejectWithValue }) => {
  try { return await updateArticle(id, data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const removeArticle = createAsyncThunk('articles/remove', async (id, { rejectWithValue }) => {
  try { await deleteArticle(id); return id; }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchCategories = createAsyncThunk('articles/fetchCategories', async (_, { rejectWithValue }) => {
  try { return await getCategories(); }
  catch (err) { return rejectWithValue(err.message); }
});

export const addCategory = createAsyncThunk('articles/addCategory', async (data, { rejectWithValue }) => {
  try { return await createCategory(data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const editCategory = createAsyncThunk('articles/editCategory', async ({ id, data }, { rejectWithValue }) => {
  try { return await updateCategory(id, data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const removeCategory = createAsyncThunk('articles/removeCategory', async (id, { rejectWithValue }) => {
  try { await deleteCategory(id); return id; }
  catch (err) { return rejectWithValue(err.message); }
});

const articlesSlice = createSlice({
  name: 'articles',
  initialState: { articles: [], categories: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchArticles.fulfilled, (state, { payload }) => { state.loading = false; state.articles = payload; })
      .addCase(fetchArticles.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(addArticle.fulfilled, (state, { payload }) => { state.articles.push(payload); })
      .addCase(addArticle.rejected, (state, { payload }) => { state.error = payload; })
      .addCase(editArticle.fulfilled, (state, { payload }) => {
        const idx = state.articles.findIndex((a) => a.id === payload.id);
        if (idx !== -1) state.articles[idx] = payload;
      })
      .addCase(editArticle.rejected, (state, { payload }) => { state.error = payload; })
      .addCase(removeArticle.fulfilled, (state, { payload }) => {
        state.articles = state.articles.filter((a) => a.id !== payload);
      })
      .addCase(removeArticle.rejected, (state, { payload }) => { state.error = payload; })
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => { state.loading = false; state.categories = payload; })
      .addCase(fetchCategories.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(addCategory.fulfilled, (state, { payload }) => { state.categories.push(payload); })
      .addCase(addCategory.rejected, (state, { payload }) => { state.error = payload; })
      .addCase(editCategory.fulfilled, (state, { payload }) => {
        const idx = state.categories.findIndex((c) => c.id === payload.id);
        if (idx !== -1) state.categories[idx] = payload;
      })
      .addCase(editCategory.rejected, (state, { payload }) => { state.error = payload; })
      .addCase(removeCategory.fulfilled, (state, { payload }) => {
        state.categories = state.categories.filter((c) => c.id !== payload);
      })
      .addCase(removeCategory.rejected, (state, { payload }) => { state.error = payload; });
  },
});

export default articlesSlice.reducer;
