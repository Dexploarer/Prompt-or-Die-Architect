import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    nextjs: {
      appDirectory: true,
    },
  },
};

export default preview;


