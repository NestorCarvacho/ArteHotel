import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = {
  children: ReactNode
  fallback: ReactNode
}

type State = {
  failed: boolean
}

export class WebGlGuard extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}
