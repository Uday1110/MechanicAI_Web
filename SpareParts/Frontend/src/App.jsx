import { Box, useColorModeValue } from "@chakra-ui/react";
import { Route, Routes } from "react-router-dom";

// import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import ProductDetails from "./store/productDetails";
import Searchdetails from "./store/searchdetails";

function App() {
	return (
		<Box minH={"100vh"} bg={useColorModeValue("custom.bgLight", "custom.bgDark")}
>
			<Navbar />
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path="/product/:id" element={<ProductDetails />}/>
				<Route path="/search/" element={<Searchdetails/>}/>
			</Routes>
		</Box>
	);
}

export default App;
