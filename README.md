<p align="center">
  <img src="./cli/logo.png" alt="Logo" width="100" />
  <br /><br />
  <span style="font-size: 32px; font-weight: bold;">lap-kit</span>
</p>

## About

**lap-kit** is a React component library that allows you to install individual components directly into your project, instead of installing the entire library as a dependency.

---
<br/><br/>


## Adding a New Component

### Step 1: Create all component files in `/src/shared/ui/<Component>`

### Step 2: Run the command to create registry files

```bash
npm run generate-registry-all
```

### Step 3: Publish changes on GitHub

---
<br/><br/>


## Testing Components Installation Locally

### Step 1: Create a Test Project

```bash
cd ~
# or
cd ~/Desktop

mkdir test-lap-kit
cd test-lap-kit
```

### Step 2: Test Init Command

```bash
npx tsx <absolute-path-to-project>/lap-kit/cli/src/index.ts init
```

### Step 3: Test Add Command

```bash
npx tsx <absolute-path-to-project>/lap-kit/cli/src/index.ts add button
```

> **Tip:** Replace `<absolute-path-to-project>` with the absolute path to project directory
