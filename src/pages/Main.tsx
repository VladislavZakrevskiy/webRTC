import socket from "../socket/socket"
import { ACTIONS } from '../../consts/actions';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import {v4} from 'uuid'
import { List, Typography, Button, ListItem, Box } from "@mui/material";


const Main = () => {
  const [rooms, setRooms] = useState([])
  const nav = useNavigate()
  const rootNode = useRef(null)

  useEffect(() => {
    socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []}) => {
      if(rootNode){
        setRooms(rooms)
      }
    })
  }, [])

  const navRoom = (id: string) => {
    nav(`/room/${id}`)
  }

  return (
    <Box p={2} ref={rootNode}>
      <Typography 
        fontSize={48}
      >
        Available Rooms
      </Typography>
      <Button variant='contained' onClick={() => navRoom(v4())}>Create new room</Button>
      <List>
        {rooms.map(roomID => (
            <ListItem key={roomID}>
              <Typography>{roomID}</Typography>
              <Button onClick={() => navRoom(roomID)}>Join room</Button>
            </ListItem>
          ))}
      </List>
    </Box>
  )
}

export default Main