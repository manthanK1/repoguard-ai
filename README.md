# RepoGuard AI
**Live Demo:** [manthankumar.in](https://www.manthankumar.in)

---

## Problem

Traditional PR review tools focus on syntax checking, formatting, linting, and static code quality. Modern software failures often originate from:

- Hidden dependency chains
- Tightly coupled modules
- Regression propagation
- Architectural impact that's difficult to visualize during code review

## Solution

RepoGuard AI introduces a **Change Risk Intelligence Layer** for pull request analysis. The platform:

- Clones and analyzes repositories
- Builds dependency graphs using AST parsing
- Estimates blast radius from changed files
- Scores architectural risk
- Visualizes dependency impact

## Key Features

- AST-based Python dependency graph generation
- Blast radius estimation
- Repository topology analysis
- Risk scoring engine
- Fan-in criticality detection
- Change surface area analysis
- Test coverage gap estimation
- Interactive dependency visualization
- Floating 3D AI assistant ("Bob")
- Railway + Vercel deployment

## How It Works

```
GitHub Repository
       ↓
Pull Request Diff Parsing
       ↓
AST Dependency Graph Generation
       ↓
Blast Radius Analysis
       ↓
Risk Signal Calculation
       ↓
Interactive Visualization
       ↓
Risk Intelligence Output
```

## Risk Scoring Model

| Signal | Description |
|---|---|
| Fan-In Criticality | How many modules depend on the changed file |
| Blast Radius Magnitude | Estimated transitive impact of the change |
| Test Coverage Gap | Uncovered affected paths |
| Change Surface Area | Scope of the diff relative to module boundaries |

## System Architecture

**Frontend**
- React + Vite
- TailwindCSS
- Three.js / React Three Fiber

**Backend**
- FastAPI (Python)
- AST, GitPython, NetworkX

**Deployment**
- Railway (backend)
- Vercel (frontend)

## Future Roadmap

- [ ] GitHub App integration
- [ ] Real-time pull request monitoring
- [ ] IBM watsonx architectural reasoning
- [ ] Enterprise policy engine
- [ ] Multi-language dependency analysis

## Author

**Manthan Kumar**

## License

MIT
