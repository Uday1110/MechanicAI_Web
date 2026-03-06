import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";
import {
  Box,
  Heading,
  Image,
  Text,
  List,
  ListItem,
  useToast,
  Button,
  useColorModeValue,
  Grid,
  GridItem,
} from "@chakra-ui/react";

const API_URL = "http://localhost:5001/api";
const ProductDetails = () => {
  const { id } = useParams(); // Get id from the URL
  const [product, setProduct] = useState(null);
  const toast = useToast();

  // Use useColorModeValue to dynamically change colors based on light/dark mode
  const bg = useColorModeValue("custom.bgLight", "custom.bgDark");
  const textColor = useColorModeValue("custom.textLight", "custom.textDark");
  const buttonBg = "custom.button";
  const buttonHover = "custom.buttonHover";

  // Fetch product details based on ID
  useEffect(() => {
    if (!id) {
      toast({
        title: "Error",
        description: "Product ID is missing.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return; // Prevent further action if id is not available
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_URL}/product/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data); // Assuming the API returns a single product
        } else {
          toast({
            title: "Error",
            description: "Product not found",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while fetching the product",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchProduct();
  }, [id, toast]);

  // Handle Buy Now action
  const handleBuyNow = async () => {
    if (!id) return;

    try {
      const response = await fetch(`${API_URL}/product/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: id }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Purchase successful!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: "Purchase failed. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during the purchase process.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const confirmBuyNow = () => {
    const confirmed = window.confirm(
      "Are you sure you want to proceed with this purchase?"
    );
    if (confirmed) {
      handleBuyNow();
    }
  };

  if (!product)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Loading />
      </div>
    ); // Show loading message while the data is being fetched

  return (
    <Box
      p={6}
      rounded="lg"
      shadow="lg"
      bg={bg}
      minHeight="100vh" // Ensure it covers the full height of the page
      mt={10} // Gap between navbar and product details
      mb={0} // Added margin-bottom to remove excess space at the bottom
    >
      <Grid
        templateColumns="1fr 2fr"
        gap={70}
        width="100%" // Ensure the grid stretches across the page
      >
        {/* Left: Product Image */}
        <GridItem display="flex" flexDirection="column" alignItems="flex-start">
          <Image
            src={product.image_url || "https://via.placeholder.com/600"}
            alt={product.name || "Product Image"}
            mb={4}
            h="500px"
            w="100%"
            objectFit="contain"
            borderRadius="md"
          />
        </GridItem>

        {/* Right: Product Details */}
        <GridItem
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="center"
        >
          <Heading as="h2" size="xl" mb={4} color={textColor}>
            {product.name || "Product Name"}
          </Heading>

          {/* Product Description */}
          <Text fontSize="lg" mb={4} color={textColor}>
            {product.description ||
              "No description available for this product."}
          </Text>

          {/* Product Price */}
          <Text fontWeight="bold" fontSize="xl" mb={4} color={textColor}>
            Price: INR {product.price ?? "N/A"}
          </Text>

          {/* Stock Information */}
          <Text
            fontWeight="semibold"
            fontSize="2xl"
            mb={4}
            color={product.stock > 5 ? "green.500" : "orange.500"}
          >
            {product.stock > 5
              ? "In Stock"
              : product.stock > 0
              ? "Only a few left in stock"
              : "Out of Stock"}
          </Text>

          {/* Brand Information */}
          <Text fontSize="sm" mb={4} color={textColor}>
            Brand: {product.brand || "N/A"}
          </Text>

          {/* Compatibility List */}
          <Text fontSize="sm" mb={2} color={textColor}>
            Compatibility:
          </Text>
          <List spacing={1} mb={4} color={textColor}>
            {product.compatibility && product.compatibility.length > 0 ? (
              product.compatibility.map((car, index) => (
                <ListItem key={index}>{car}</ListItem>
              ))
            ) : (
              <Text color={textColor}>
                No compatibility information available.
              </Text>
            )}
          </List>

          {/* Buy Now Button */}
          <Button
            bg={buttonBg}
            color="white"
            _hover={{ bg: buttonHover }}
            isDisabled={product.stock <= 0}
            onClick={confirmBuyNow}
          >
            Buy Now
          </Button>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default ProductDetails;
