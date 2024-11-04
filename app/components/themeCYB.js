
import { createTheme } from "@mui/material";
import { mdiGhost, mdiPenguin } from '@mdi/js';

const themes = {
  main: {
    palette: {
      mode: "dark",
      primary: {
        main: "#d2a30e",
      },
      secondary: {
        main: "#ac0bce",
      },
      warning: {
        main: "#ffe358",
      },
      background: {
        // paper: "#181817",
      },
    },
    profilePic: mdiPenguin
  },
  halloween: {
    palette: {
      mode: "dark",
      primary: {
        main: "#E66C2C",
      },
      secondary: {
        main: "#ac0bce",
      },
      warning: {
        main: "#ffe358",
      },
      background: {
        // paper: "#181817",
      },
    },
    profilePic: mdiGhost
  }
}

export const cybTheme = createTheme(themes["main"]);