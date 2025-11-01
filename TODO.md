# TODO: Implement Quit Navigation in DonorDashboard

- [x] Import useNavigate from 'react-router-dom' in DonorDashboard.js
- [x] Declare const navigate = useNavigate(); in DonorDashboard component
- [x] Pass navigate as prop to Sidebar component: <Sidebar navigate={navigate} />
- [x] Update Quit link in Sidebar to use onClick={() => navigate('/login')} and remove href="#", add cursor pointer style
- [x] Test the navigation by running the app and clicking Quit
