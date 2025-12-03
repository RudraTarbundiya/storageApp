import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./components/home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path:'/directory/:id',
    element:<Home/>
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;