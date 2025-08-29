Playbook: Create a Story in Storybook.js for Extension
Overview
Create stories to test React UI components in isolation.

What's needed from the user
Component file name for which Story needs to be written
Procedure
Read through the following guidelines before getting started:

Contributing Standards
Developing Standards
Ensure the environment is set up correctly: run yarn tsc, and make sure that no errors are printed. If there are errors, report to the user. Run yarn test to get an idea of what tests are failing.

Switch to a new branch called storybook-{{filename}}-{{timestamp}}, where filename is the name of the file you're converting. Ensure that this branch does not already exist.

Install the right node version:

Run the command nvm install 18 && nvm use 18 && nvm alias default 18
Add nvm use 18 in bashrc file to use node version 18 then do source ~/.bashrc.
Finally, run yarn install
Use find command from Project directory to find the specified component parent directory, its component file, its test file and constants file ( they are usually in same directory ) for picking up values then create a new file named stories/[ComponentName].stories.tsx in the same directory.

Run ls command at the component directory to see the files in the directory.
RUN cat or OPEN command on the component ,.test and .constants file to see the content of the file.
The structure of the direcotry will be:
src/elements/[ComponentParent]/
src/elements/[ComponentParent]/stories/
src/elements/[ComponentParent]/constants.js
src/elements/[ComponentParent]/[ComponentName].js -> src/elements/[ComponentParent]/[ComponentName].tsx
Writing only the default the story for the component and only creating additional stories if they render in a significantly different state.

Check src/__mock__ directory for using already present mocks.

Do not edit any other files except the story file , try to mock the functions, interfaces, and data that the component uses.

The following is an example of a story for a ModalBody component:

  import React from 'react';
  import type { Meta, StoryObj } from '@storybook/react';
  import {
    BackgroundColor,
    Display,
    FlexDirection,
  } from '../../../helpers/constants/design-system';
  import { Text } from '..';
  import README from './README.mdx';
  import { ModalBody } from './modal-body';

  const meta: Meta<typeof ModalBody> = {
    title: 'Components/ComponentLibrary/ModalBody',
    component: ModalBody,
    parameters: {
      docs: {
        page: README,
      },
    },
    argTypes: {
      className: {
        control: 'text',
      },
      children: {
        control: 'text',
      },
    },
    args: {
      className: '',
      children: 'Modal Body',
    },
  };

  export default meta;
  type Story = StoryObj<typeof ModalBody>;

  export const DefaultStory: Story = {};

  DefaultStory.storyName = 'Default';

  export const Children: Story = {
    args: {
      children:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue. Nullam id dolor id nibh ultricies vehicula ut id elit. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla.',
    },
    render: (args) => (
      <div style={{ height: 100, width: 300 }}>
        <ModalBody {...args} />
      </div>
    ),
  };

  export const Padding: Story = {
    args: {
      paddingLeft: 0,
      paddingRight: 0,
      gap: 4,
      display: Display.Flex,
      flexDirection: FlexDirection.Column,
    },
    render: (args) => (
      <div style={{ height: 200, width: 300 }}>
        <ModalBody {...args}>
          <Text paddingLeft={4} paddingRight={4}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae
            elit libero, a pharetra augue. Nullam id
          </Text>
          <Text
            backgroundColor={BackgroundColor.primaryMuted}
            paddingLeft={4}
            paddingRight={4}
          >
            Element touches edge of ModalBody
          </Text>
          <Text paddingLeft={4} paddingRight={4}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae
            elit libero, a pharetra augue. Nullam id
          </Text>
        </ModalBody>
      </div>
    ),
  };
Start by importing the component + necessary dependencies at the top of the file.

Define a default export in your story file that includes:

title: the path within Storybook's UI use the components file path but change the formatting and remove the first UI/ folder (e.g., "Components/ComponentLibrary/ModalBody").
component: the component itself.
argTypes: optional list of prop types to pass to the component.
args: optional specific props being passed to the component (often using dummy data).
decorators: optional list of decorators to wrap the component in. In this case, we're wrapping the component in a Provider to provide the necessary Redux store.
Often we will need to wrap the component in a Provider to provide the necessary Redux store. Create custom storeMock data to mimic what the component needs.
Create just a single default story for now.

Run the story using yarn storybook and navigate to the story within the Storybook UI. If any errors are thrown, go back and fix the story you created. Any errors MUST only be fixed in the story file you created. Don't edit any other files under any circumstances without permission from the user.

Run yarn test --updateSnapshot , yarn lint:fix commands to ensure that the code is clean and the tests are passing.

Also run yarn lint to check if any linting errors still exists related to the current component and fix those errors only if they are related to the current component not any other component.

Optionally create additional stories

If there is a significant logic branch/conditional rendering in the component that is not covered in the default story, create additional stories
Run the story using yarn storybook and navigate to the story within the Storybook UI. If any errors are thrown, go back and fix the story you created. Any errors MUST only be fixed in the story file you created. Don't edit any other files under any circumstances without permission from the user.
Check story

Check the initial component files props and make sure there isn't any additional props in the story that don't align with the component props
If there are any errors in the storybook UI in the browser go debug. Look at the initial component file and make sure the correct mock data is being passed in.
Verification

Run git command to see what files have been changed git status and check if only the [ComponentName].stories.tsx file has been changed and revert any changes if any other files have been changed.
Confirm via the Storybook UI that every story does contains something different. Remove duplicates i.e. if any stories have identical props.
Run yarn test --updateSnapshot , yarn lint:fix commands to ensure that the code is clean and the tests are passing.
Take a screenshot of the Storybook UI

Search the file(s) in storybook, open them, take a screenshot and save it as {componentName}.png for each file
Send the .png file(s) as attachment(s) to the user
DO NOT save the images inside the repo folder
Send your screenshot to the user in chat.
Open a new draft pull request following the given PR template.

Add and Commit the changes git add [ComponentName].stories.tsx and git commit -m "chore: Create a story for [ComponentName] component".

git push origin devin/story-{random-3-character-string}.

Create Draft PR using gh pr create --draft command.

PR title should be chore: Create a story for [ComponentName] component.

Use the following template for the pull request description by following command gh pr create --draft --fill and fill the necessary details in the PR description via gh pr edit command.

  ## **Description**

  <!--
  [TODO]
  Write a short description of the changes included in this pull request, also include relevant motivation and context. Have in mind the following questions:
  1. What is the reason for the change?
  2. What is the improvement/solution?
  -->

  ## **Related issues**
  N/A

  ## **Manual testing steps**

  3. Go to the latest build of storybook in this PR
  4. Navigate to the <componentName> component in the Components/ folder.

  ## **Screenshots/Recordings**

  <Case1-screenshot-url>
  https://api.devin.ai/attachments/<hash>/<screenshot-name>.png

  <Case2-screenshot-url>
  https://api.devin.ai/attachments/<hash>/<screenshot-name>.png

  ## **Pre-merge author checklist**

  - [X] I've followed [Contributing Standards](<link>)
  - [X] I've followed [Developing Standards](<link>)
  - [X] I've completed the PR template to the best of my ability
  - [X] I've included tests if applicable
  - [X] I've documented my code using [JSDoc](https://jsdoc.app/) format if applicable

  ## **Pre-merge reviewer checklist**

  - [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
  - [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.
Note: For the screenshots, you must provide a URL to the screenshots that you took earlier. The URL will look something like https://api.devin.ai/attachments/[hash]/[screenshot-name].png

Check the screenshots URL on browser before attaching them to the PR.

DO NOT add any additional information outside of the listed TODO sections

Fill out TODO sections (added as comments) in the below template

DO NOT add link to the preview

DO NOT use \n in pr creation instead use open quotes to write the PR body " and goto the next line by entering (use editor to write PR Description).

Do not Make any other .md files for PR description.

Push the changes in the PR branch and open the PR.
Run git add [ComponentName].stories.tsx and git commit -m "chore: Create a story for [ComponentName] component" commands to commit the changes.
Add team-design-system and No QA Needed labels to the PR via `gh pr --add-label team-design-system --add-label team-ai command.
Run git push origin devin/story-{random-3-character-string} command to push the changes in the PR branch.
Run gh pr view --web command to open the PR in the browser and check if the PR has been created successfully.
Check if the PR follows the guidelines ( and has necessary details ), if not, re-edit the same PR and send it to the user.
Send the PR to the user:
Go to Github to check if the PR follows the guidelines ( and has necessary details ) and has the necessary screenshots, if not, re-edit the same PR and send it to the user.
Specifications
Besides the default story, you must only add additional stories if they include the play function and trigger the component to render in a significantly different state.
There should be no errors anywhere in the code.
PR template is filled out correctly with the necessary screenshots.
ABSOLUTELY DO NOT edit any file other than [ComponentName].stories.tsx or files in the .storybook folder!
Do not install any additional libraries. If you think you must, always ask the user first.
Forbidden Actions
Do not edit any other files except the story file.
Do not add or install any additional libraries.
Advice and Pointers
Don't worry about adding any additional styling outside of what's already there.
Use find command to find any file from home directory. For example, find . -name "filename".
Do not create Multiple commits in the PR. Create a single commit with all the changes.