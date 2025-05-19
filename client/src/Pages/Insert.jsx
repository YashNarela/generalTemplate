import React, { useState } from 'react'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';


const Insert = () => {


  const [inputHandle, setInputHandle] = useState({})


  function changeHandler(e) {

    const { name, value } = e.target;

    setInputHandle(val => ({ ...val, [name]: value }))

    console.log(inputHandle);
  }



  function submitHandler(e) {

    e.preventDefault()
  }


  return (
    <>
      <Form style={{ width: "50%" }} onSubmit={submitHandler} >

        <Form.Control className="mb-2" id="inlineFormInput" placeholder="Yash Narela" type='text' name='name' onChange={changeHandler} />
        <Form.Control id="inlineFormInputGroup" placeholder="email" type='text' name='email' onChange={changeHandler} />

        <Button type="submit" className="mb-2"> Submit </Button>
      </Form>

    </>
  )
}

export default Insert
