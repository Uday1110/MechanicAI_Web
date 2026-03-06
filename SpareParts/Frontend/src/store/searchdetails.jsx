import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Box,
  SimpleGrid,
  Text,
  Button,
  Card,
  CardBody,
  Stack,
  Image,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";

const API_URL = "http://localhost:5001/api";
const SearchResultsPage = () => {
  const location = useLocation(); // To access the search query from the URL
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState(null);

  // Extract query from the URL
  const searchQuery = new URLSearchParams(location.search).get("query");

  // Get the theme values for the colors (same as in ProductCard)
  const cardBg = useColorModeValue("custom.bgLight", "custom.bgDark");
  const textColor = useColorModeValue("custom.textLight", "custom.textDark");
  const buttonBg = useColorModeValue("custom.button", "custom.button");
  const buttonHover = useColorModeValue("custom.buttonHover", "custom.buttonHover");

  useEffect(() => {
    // Fetch products based on the search query
    const fetchProducts = async () => {
      setLoading(true);
      setError(null); // Reset errors on each fetch
      try {
        const response = await fetch(API_URL+"/product-list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ parts: [searchQuery] }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setProducts(data.data);
          } else {
            setProducts([]); // No products found, but no error
          }
        } else {
          setError("Failed to fetch products.");
        }
      } catch (error) {
        setError("An error occurred while fetching the products.");
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      fetchProducts();
    } else {
      setError("Search query is missing.");
      setProducts([]); // Clear products if query is missing
    }
  }, [searchQuery]);

  return (
    <Box p={0} m={0} minHeight="100vh" mt={50}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Spinner size="xl" />
        </Box>
      ) : error ? (
        <Text color="red.500" textAlign="center">
          {error}
        </Text>
      ) : products.length === 0 ? (
        <Text textAlign="center" color="gray.500" fontSize="lg">
          No products found.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {products.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} style={{ textDecoration: "none" }}>
              <Card
                borderRadius="md"
                boxShadow="md"
                bg={cardBg}
                cursor="pointer"
                _hover={{ transform: "translateY(-5px)", shadow: "xl" }}
              >
                <CardBody>
                  <Stack spacing={4}>
                    <Image
                      src={product.image || "https://via.placeholder.com/150"} // Placeholder if no image
                      alt={product.name}
                      borderRadius="md"
                    />
                    <Text fontSize="xl" fontWeight="bold" color={textColor}>
                      {product.name}
                    </Text>
                    <Button
                      bg={buttonBg}
                      color="white"
                      _hover={{ bg: buttonHover }}
                      width="100%"
                      mt={4}
                    >
                      View Details
                    </Button>
                  </Stack>
                </CardBody>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default SearchResultsPage;
