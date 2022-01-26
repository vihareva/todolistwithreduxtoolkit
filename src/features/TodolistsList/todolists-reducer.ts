import {todolistsAPI, TodolistType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {RequestStatusType, setAppStatusAC} from '../../app/app-reducer'
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {handleServerNetworkError} from "../../utils/error-utils";
import {AxiosError} from "axios";

const initialState: Array<TodolistDomainType> = []

export const fetchTodolists = createAsyncThunk(
    "todolists/fetchTodolists",
    async (param, {dispatch, rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        try {
            const res = await todolistsAPI.getTodolists()
            dispatch(setAppStatusAC({status: 'succeeded'}))
            // dispatch(setTodolistsAC({todolists:res.data}))
            return {todolists: res.data}
        } catch (err) {
            const error = err as AxiosError
            handleServerNetworkError(error, dispatch);
            rejectWithValue(null)
        }
    }
)
export const removeTodolist = createAsyncThunk(
    "todolists/removeTodolist",
    async (todolistId: string, {dispatch, rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        dispatch(changeTodolistEntityStatusAC({id: todolistId, status: 'loading'}))
        const res = await todolistsAPI.deleteTodolist(todolistId)
        dispatch(setAppStatusAC({status: 'succeeded'}))
        return {id: todolistId}
    }
)
export const addTodolist = createAsyncThunk(
    "todolists/addTodolist",
    async (title: string, {dispatch, rejectWithValue}) => {
        dispatch(setAppStatusAC({status: 'loading'}))
        const res = await todolistsAPI.createTodolist(title)
        dispatch(setAppStatusAC({status: 'succeeded'}))
        return {todolist: res.data.data.item}
    }
)
export const changeTodolistTitle = createAsyncThunk(
    "todolists/changeTodolistTitle",
    async (param: { id: string, title: string }, {dispatch, rejectWithValue}) => {
        const res = await todolistsAPI.updateTodolist(param.id, param.title)
      return {id:param.id, title:param.title}
    }
)

const slice = createSlice({
    name: "todolists",
    initialState,
    reducers: {
        changeTodolistFilterAC(state, action: PayloadAction<{ id: string, filter: FilterValuesType }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id)
            state[index].filter = action.payload.filter
        },
        changeTodolistEntityStatusAC(state, action: PayloadAction<{ id: string, status: RequestStatusType }>) {
            const index = state.findIndex(tl => tl.id === action.payload.id)
            state[index].entityStatus = action.payload.status
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTodolists.fulfilled, (state, action) => {
                return action.payload?.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}))
            })
            .addCase(removeTodolist.fulfilled, (state, action) => {
                const index = state.findIndex(tl => tl.id === action.payload.id)
                state.splice(index, 1)
            })
            .addCase(addTodolist.fulfilled, (state, action) => {
                state.unshift({...action.payload.todolist, filter: 'all', entityStatus: 'idle'})
            })
            .addCase(changeTodolistTitle.fulfilled, (state, action) => {
                const index = state.findIndex(tl => tl.id === action.payload.id)
                state[index].title = action.payload.title
            })
    }
})

export const todolistsReducer = slice.reducer
export const {changeTodolistEntityStatusAC, changeTodolistFilterAC,} = slice.actions


// types
export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}

