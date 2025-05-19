import React from 'react'

import { increment } from '../redux/slices/firstSlice'

import { useDispatch, useSelector } from 'react-redux'
const Slice = () => {


    const dispatch = useDispatch()
    const value = useSelector((state) => state.rnd.value)
    console.log(value);


    return (
        <div>

            <h1>Redux Toolkit Slice</h1>
            <h2>{value}</h2>
            <button onClick={() => dispatch(increment())}>Increment</button>


        </div>
    )
}

export default Slice