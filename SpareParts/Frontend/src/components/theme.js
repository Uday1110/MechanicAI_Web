import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    colors: {
        custom: {
            bgLight: "#ffffff",
            bgDark: "#161622",
            textLight: "#000000",
            textDark: "#ffffff",
            button: "#FF9001",
            
            buttonHover: "#cc7300",
        },
    },
    config: {
        initialColorMode: "light",
        useSystemColorMode: true,
    },
});

export default theme;
