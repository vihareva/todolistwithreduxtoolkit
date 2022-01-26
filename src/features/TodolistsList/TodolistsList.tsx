import React, {useCallback, useEffect} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {AppRootStateType} from '../../app/store'
import {
    addTodolist, changeTodolistFilterAC,
    changeTodolistTitle, fetchTodolists,
    FilterValuesType, removeTodolist,
    TodolistDomainType
} from './todolists-reducer'
import {TasksStateType, removeTask, updateTask, addTask} from './tasks-reducer'
import {TaskStatuses} from '../../api/todolists-api'
import {Grid, Paper} from '@material-ui/core'
import {AddItemForm} from '../../components/AddItemForm/AddItemForm'
import {Todolist} from './Todolist/Todolist'
import { Redirect } from 'react-router-dom'

type PropsType = {
    demo?: boolean
}

export const TodolistsList: React.FC<PropsType> = ({demo = false}) => {
    const todolists = useSelector<AppRootStateType, Array<TodolistDomainType>>(state => state.todolists)
    const tasks = useSelector<AppRootStateType, TasksStateType>(state => state.tasks)
    const isLoggedIn = useSelector<AppRootStateType, boolean>(state => state.auth.isLoggedIn)

    const dispatch = useDispatch()

    useEffect(() => {
        if (demo || !isLoggedIn) {
            return;
        }
        const thunk = fetchTodolists()
        dispatch(thunk)
    }, [])

    const onRemoveTask = useCallback(function (taskId: string, todolistId: string) {
        const thunk = removeTask({taskId, todolistId})
        dispatch(thunk)
    }, [])

    const onAddTask = useCallback(function (title: string, todolistId: string) {
        const thunk = addTask({title, todolistId})
        dispatch(thunk)
    }, [])

    const changeStatus = useCallback(function (id: string, status: TaskStatuses, todolistId: string) {
        const thunk = updateTask({taskId:id, model:{status},todolistId})
        dispatch(thunk)
    }, [])

    const changeTaskTitle = useCallback(function (id: string, newTitle: string, todolistId: string) {
        const thunk = updateTask({taskId:id, model:{title: newTitle},todolistId})
        dispatch(thunk)
    }, [])

    const changeFilter = useCallback(function (value: FilterValuesType, todolistId: string) {
        const action = changeTodolistFilterAC({id:todolistId, filter: value})
        dispatch(action)
    }, [])

    const onRemoveTodolist = useCallback(function (id: string) {
        const thunk = removeTodolist(id)
        dispatch(thunk)
    }, [])

    const onChangeTodolistTitle = useCallback(function (id: string, title: string) {
        const thunk = changeTodolistTitle({id, title})
        dispatch(thunk)
    }, [])

    const onAddTodolist = useCallback((title: string) => {
        const thunk = addTodolist(title)
        dispatch(thunk)
    }, [dispatch])

    if (!isLoggedIn) {
        return <Redirect to={"/login"} />
    }

    return <>
        <Grid container style={{padding: '20px'}}>
            <AddItemForm addItem={onAddTodolist}/>
        </Grid>
        <Grid container spacing={3}>
            {
                todolists.map(tl => {
                    let allTodolistTasks = tasks[tl.id]

                    return <Grid item key={tl.id}>
                        <Paper style={{padding: '10px'}}>
                            <Todolist
                                todolist={tl}
                                tasks={allTodolistTasks}
                                removeTask={onRemoveTask}
                                changeFilter={changeFilter}
                                addTask={onAddTask}
                                changeTaskStatus={changeStatus}
                                removeTodolist={onRemoveTodolist}
                                changeTaskTitle={changeTaskTitle}
                                changeTodolistTitle={onChangeTodolistTitle}
                                demo={demo}
                            />
                        </Paper>
                    </Grid>
                })
            }
        </Grid>
    </>
}
