import { AppBar, Container, Toolbar, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom"


const Header = () => {
    const nav = useNavigate()

    return (
        <AppBar position="static">
        <Container maxWidth="xl">
        <Toolbar disableGutters>
        <Typography
            variant="h6"
            noWrap
            component="a"
            sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
            }}
            onClick={() => nav('/')}
            >
            VIDEOCHAT
            </Typography>
        </Toolbar>
        </Container>
    </AppBar>
    )
}

export default Header