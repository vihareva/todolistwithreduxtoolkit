import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from '../../api/todolists-api'
import {AppRootStateType} from '../../app/store'
import {setAppStatusAC} from '../../app/app-reducer'
import {handleServerAppError} from '../../utils/error-utils'
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {addTodolist, fetchTodolists, removeTodolist} from "./todolists-reducer";

const initialState: TasksStateType = {}

export const fetchTasks = createAsyncThunk(
    "tasks/fetchTasks",
    async (todolistId: string, thunkAPI) => {
        thunkAPI.dispatch(setAppStatusAC({status: 'loading'}))
        const res = await todolistsAPI.getTasks(todolistId)
        const tasks = res.data.items
        //thunkAPI.dispatch(setTasksAC({tasks, todolistId}))
        thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}))
        return {tasks, todolistId}
    }
)

export const removeTask = createAsyncThunk(
    "tasks/removeTask",
    async (param: { taskId: string, todolistId: string }, thunkAPI) => {
        const res = await todolistsAPI.deleteTask(param.todolistId, param.taskId)
        // const action = removeTaskAC({taskId:param.taskId, todolistId:param.todolistId})
        // thunkAPI.dispatch(action)
        return {taskId: param.taskId, todolistId: param.todolistId}
    }
)
export const addTask = createAsyncThunk(
    "tasks/addTask",
    async (param: { title: string, todolistId: string }, {
        dispatch,
        rejectWithValue
    }) => {
        try {
            dispatch(setAppStatusAC({status: 'loading'}))
            const res = await todolistsAPI.createTask(param.todolistId, param.title)
            if (res.data.resultCode === 0) {
                const task = res.data.data.item
                // const action = addTaskAC({task})
                // dispatch(action)
                dispatch(setAppStatusAC({status: 'succeeded'}))
                return {task}
            } else {
                handleServerAppError(res.data, dispatch);
                return rejectWithValue(null)
            }
        } catch (error) {
            debugger
           // handleServerNetworkError(error, dispatch)
            return rejectWithValue(null)
        }
    }
)
export const updateTask = createAsyncThunk(
    "tasks/updateTask",
    async (param: { taskId: string, model: UpdateDomainTaskModelType, todolistId: string }, {
        dispatch,
        rejectWithValue,
        getState
    }) => {
        const {taskId,todolistId,model}=param
        const state = getState() as AppRootStateType
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            return rejectWithValue('task not found in the state')
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...model
        }
        try {
            const res = await todolistsAPI.updateTask(todolistId, taskId, apiModel)
            if (res.data.resultCode === 0) {
                // const action = updateTaskAC({taskId, model, todolistId})
                // dispatch(action)
                return {taskId, model, todolistId}
            } else {
                handleServerAppError(res.data, dispatch);
                return rejectWithValue(null)
            }
        } catch (error) {
            //handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    }
)

const slice = createSlice({
    name: "tasks",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(addTodolist.fulfilled, (state, action) => {
                state[action.payload.todolist.id] = []
            })
            .addCase(removeTodolist.fulfilled, (state, action) => {
                delete state[action.payload.id]
            })
            .addCase(fetchTodolists.fulfilled, (state, action) => {
                action.payload?.todolists.forEach(tl => {
                    state[tl.id] = []
                })
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks
            })
            .addCase(removeTask.fulfilled, (state, action) => {
                const index = state[action.payload.todolistId].findIndex(t => t.id === action.payload.taskId)
                state[action.payload.todolistId].splice(index, 1)
            })
            .addCase(addTask.fulfilled, (state, action) => {
                state[action.payload.task.todoListId].unshift(action.payload.task)
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex(t => t.id === action.payload.taskId)
                if (index > -1) {
                    tasks[index] = {...tasks[index], ...action.payload.model}
                }
            })
    },

})


export const tasksReducer = slice.reducer

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}


