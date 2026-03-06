import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link } from "react-router-dom"; // Make sure this is imported

const ProductCard = ({ product }) => {
  // Apply custom colors from the theme
  const bg = useColorModeValue("custom.bgLight", "custom.bgDark");
  const textColor = useColorModeValue("custom.textLight", "custom.textDark");
  const buttonBg = useColorModeValue("custom.button", "custom.button");
  const buttonHover = useColorModeValue(
    "custom.buttonHover",
    "custom.buttonHover"
  );


  return (
    <Link to={`/product/${product._id}`}>
      <Box
        shadow="lg"
        rounded="lg"
        overflow="hidden"
        transition="all 0.3s"
        _hover={{ transform: "translateY(-5px)", shadow: "xl" }}
        bg={bg}
        cursor="pointer" // Make it visually clear that it's clickable
      >
        <Image
          src={product.image_url}
          alt={product.name}
          h={48}
          w="full"
          objectFit="cover"
        />

        <Box p={4}>
          <Heading as="h3" size="md" mb={2} color={textColor}>
            {product.name}
          </Heading>

          <Text fontWeight="bold" fontSize="xl" color={textColor} mb={4}>
            INR: {product.price}
          </Text>

          <HStack justify="space-between">
            <Text
              fontWeight="bold"
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

            <HStack spacing={2}>
              <Button bg={buttonBg} color="white" _hover={{ bg: buttonHover }}>
                View Details
              </Button>
            </HStack>
          </HStack>
        </Box>
      </Box>
    </Link>
  );
};

export default ProductCard;
