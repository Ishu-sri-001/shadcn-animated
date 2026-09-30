"use client"

import * as React from "react"

type ItemStatus = "unanswered" | "answered" | "skipped"
type ShortcutMode = "letters" | "numbers"
type Direction = "next" | "previous"

type RenderFn<S> = (props: Record<string, unknown>, state: S) => React.ReactElement
type Part<Tag extends React.ElementType, S = object> = React.ComponentPropsWithRef<Tag> & {
  render?: React.ReactElement | RenderFn<S>
}

type AnswerControl =
  | { type: "choice"; id: string; element: HTMLInputElement; disabled: boolean; ownDisabled: boolean; value: string }
  | { type: "input"; id: string; element: HTMLInputElement; disabled: boolean }

type RegisteredItem = {
  name: string
  element: HTMLElement
  disabled: boolean
  required: boolean
  status: ItemStatus
  focus: () => void
  focusInvalid: () => void
  getAnswerByElement: (element: Element) => AnswerControl | null
  getAnswerByShortcut: (shortcut: string) => AnswerControl | null
  moveAnswerFocus: (element: Element, direction: Direction) => boolean
  reset: () => void
  skip: () => void
  validate: () => boolean
}

type RootContextValue = {
  current: number
  first: boolean
  last: boolean
  total: number
  activeItemName: string | null
  activeItemRequired: boolean | null
  activeItemStatus: ItemStatus | null
  domVersion: number
  goNext: () => void
  goPrevious: () => void
  nativeValidation: boolean
  registerItem: (item: RegisteredItem) => () => void
  shortcuts: ShortcutMode | null
  skipCurrent: () => void
}

type ItemContextValue = {
  active: boolean
  disabled: boolean
  hasInputAnswer: boolean
  invalid: boolean
  multiple: boolean
  name: string
  registerAnswerControl: (control: AnswerControl) => () => void
  registerAnswerSelection: (id: string, selected: boolean) => () => void
  registerDescription: (id: string) => () => void
  registerError: (id: string) => () => void
  required: boolean
  resetVersion: number
  selectedAnswerIds: string[]
  setAnswerDefault: (id: string, selected: boolean) => void
  setAnswerSelectionFromInteraction: (id: string, selected: boolean) => void
  shortcutByAnswerId: Map<string, string>
  shortcuts: ShortcutMode | null
  status: ItemStatus
  syncControlledAnswerSelection: (id: string, selected: boolean) => void
}

type ChoiceState = {
  checked: boolean
  disabled: boolean
  invalid: boolean
  shortcut: string | null
  type: "checkbox" | "radio"
}

type ChoiceContextValue = {
  inputProps: React.ComponentPropsWithRef<"input">
  state: ChoiceState
}

type ProgressState = { current: number; first: boolean; last: boolean; total: number }

type NavState = {
  disabled: boolean
  shortcut: "Enter" | null
  status: ItemStatus | null
  visible: boolean
}

const RootContext = React.createContext<RootContextValue | null>(null)
const ItemContext = React.createContext<ItemContextValue | null>(null)
const ChoiceContext = React.createContext<ChoiceContextValue | null>(null)

function useRootContext(part: string) {
  const context = React.useContext(RootContext)
  if (!context) throw new Error(`${part} must be used within a Questionnaire root.`)
  return context
}

function useItemContext(part: string) {
  const context = React.useContext(ItemContext)
  if (!context) throw new Error(`${part} must be used within a Questionnaire item.`)
  return context
}

function useChoiceContext(part: string) {
  const context = React.useContext(ChoiceContext)
  if (!context) throw new Error(`${part} must be used within a Questionnaire choice.`)
  return context
}

// Rendering helpers

function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) (ref as React.RefObject<T | null>).current = node
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  const list = refs.filter(Boolean)
  if (list.length === 0) return undefined
  return (node: T | null) => {
    for (const ref of list) assignRef(ref, node)
  }
}

function mergeProps(...sources: (Record<string, unknown> | undefined)[]) {
  const result: Record<string, unknown> = {}
  for (const source of sources) {
    if (!source) continue
    for (const key of Object.keys(source)) {
      const value = source[key]
      if (value === undefined) continue
      const previous = result[key]
      if (key === "className") {
        result[key] = [previous, value].filter(Boolean).join(" ")
      } else if (key === "style") {
        result[key] = { ...(previous as object), ...(value as object) }
      } else if (key === "ref") {
        result[key] = mergeRefs(previous as React.Ref<unknown>, value as React.Ref<unknown>)
      } else if (/^on[A-Z]/.test(key) && typeof previous === "function" && typeof value === "function") {
        // The later handler runs first and can stop the earlier one
        result[key] = (event: React.SyntheticEvent) => {
          ;(value as (e: React.SyntheticEvent) => void)(event)
          if (!event.defaultPrevented) (previous as (e: React.SyntheticEvent) => void)(event)
        }
      } else {
        result[key] = value
      }
    }
  }
  return result
}

type AttributeMap<S> = { [K in keyof S]?: (value: S[K]) => Record<string, string | undefined> }

function stateToAttributes<S extends object>(state: S, mapping?: AttributeMap<S>) {
  const attributes: Record<string, string | undefined> = {}
  for (const key of Object.keys(state) as (keyof S & string)[]) {
    const value = state[key]
    const custom = (mapping?.[key] as ((v: unknown) => Record<string, string | undefined>) | undefined)?.(value)
    if (custom) {
      Object.assign(attributes, custom)
      continue
    }
    const attribute = `data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
    if (typeof value === "boolean") attributes[attribute] = value ? "" : undefined
    else if (value != null) attributes[attribute] = String(value)
  }
  return attributes
}

function renderPart<S extends object>({
  tag,
  props,
  render,
  state,
  mapping,
}: {
  tag: string
  props: Record<string, unknown>
  render?: React.ReactElement | RenderFn<S>
  state?: S
  mapping?: AttributeMap<S>
}) {
  const merged = mergeProps(state ? stateToAttributes(state, mapping) : undefined, props)
  if (!render) return React.createElement(tag, merged)
  if (typeof render === "function") return render(merged, state ?? ({} as S))
  const own = render.props as Record<string, unknown>
  return React.cloneElement(render, {
    ...mergeProps(merged, own),
    ref: mergeRefs(merged.ref as React.Ref<unknown>, own.ref as React.Ref<unknown>),
  } as Record<string, unknown>)
}

const checkedMapping = {
  checked: (value: boolean) => ({
    "data-checked": value ? "" : undefined,
    "data-unchecked": value ? undefined : "",
  }),
}

// Answer helpers

function hasText(value: unknown) {
  if (Array.isArray(value)) return value.some((v) => String(v).trim().length > 0)
  return value != null && String(value).trim().length > 0
}

function shortcutKeys(mode: ShortcutMode | null) {
  if (mode === "letters") return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
  if (mode === "numbers") return Array.from({ length: 9 }, (_, i) => String(i + 1))
  return []
}

function normalizeShortcutKey(key: string, mode: ShortcutMode) {
  const value = mode === "letters" ? key.toUpperCase() : key
  return shortcutKeys(mode).includes(value) ? value : null
}

function keyShortcuts(shortcut: string | null, withEnter: boolean) {
  return [shortcut, withEnter ? "Enter" : null].filter(Boolean).join(" ") || undefined
}

function isAnswered(answer: AnswerControl) {
  if (answer.type === "choice") return answer.element.checked
  return answer.element.hasAttribute("name") && hasText(answer.element.value)
}

function isEmptyTextInput(answer: AnswerControl | null) {
  return (
    answer?.type === "input" &&
    ["email", "password", "search", "tel", "text", "url"].includes(answer.element.type) &&
    !hasText(answer.element.value)
  )
}

function isEditable(element: Element) {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return true
  if (element instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "reset", "submit"].includes(element.type)
  }
  return element instanceof HTMLElement && element.isContentEditable
}

function isRadio(element: Element) {
  return element instanceof HTMLInputElement && element.type === "radio"
}

function byDomOrder(a: { element: Element }, b: { element: Element }) {
  if (a.element === b.element) return 0
  const position = a.element.compareDocumentPosition(b.element)
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

// Hooks

function useChoice({
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  value,
}: {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  value: string
}): ChoiceContextValue {
  const {
    disabled: itemDisabled,
    hasInputAnswer,
    invalid,
    multiple,
    name,
    registerAnswerControl,
    registerAnswerSelection,
    required,
    resetVersion,
    selectedAnswerIds,
    setAnswerDefault,
    setAnswerSelectionFromInteraction,
    shortcutByAnswerId,
    status,
    syncControlledAnswerSelection,
  } = useItemContext("Questionnaire choice")

  const id = React.useId()
  const [element, setElement] = React.useState<HTMLInputElement | null>(null)
  const initialChecked = React.useRef(defaultChecked)
  const controlled = checked !== undefined
  const isDisabled = itemDisabled || disabled
  const selected = selectedAnswerIds.includes(id)
  const isChecked = controlled ? (status === "skipped" ? false : checked) : selected
  const type = multiple ? "checkbox" : "radio"
  const shortcut = shortcutByAnswerId.get(id) ?? null

  React.useLayoutEffect(() => registerAnswerSelection(id, initialChecked.current), [id, registerAnswerSelection])

  React.useLayoutEffect(() => {
    setAnswerDefault(id, defaultChecked)
  }, [id, defaultChecked, setAnswerDefault])

  React.useLayoutEffect(() => {
    if (!element) return
    return registerAnswerControl({ type: "choice", id, element, disabled: isDisabled, ownDisabled: disabled, value })
  }, [id, disabled, isDisabled, element, registerAnswerControl, value])

  React.useLayoutEffect(() => {
    if (controlled) syncControlledAnswerSelection(id, checked)
  }, [id, controlled, checked, resetVersion, syncControlledAnswerSelection])

  React.useLayoutEffect(() => {
    if (!element) return
    // eslint-disable-next-line react-hooks/immutability
    element.defaultChecked = controlled ? checked : defaultChecked
    if (resetVersion > 0) element.checked = isChecked
  }, [isChecked, controlled, checked, defaultChecked, element, resetVersion])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(event)
    if (event.defaultPrevented) return
    if (!controlled) {
      setAnswerSelectionFromInteraction(id, event.target.checked)
      return
    }
    if (status === "skipped" && checked === event.target.checked) {
      setAnswerSelectionFromInteraction(id, checked)
    }
  }

  return {
    inputProps: {
      ref: setElement,
      "aria-invalid": invalid || undefined,
      "aria-keyshortcuts": keyShortcuts(shortcut, !isDisabled && isChecked),
      checked: isChecked,
      disabled: isDisabled,
      id,
      name: status === "skipped" ? undefined : name,
      onChange: handleChange,
      required: required && !multiple && !hasInputAnswer,
      type,
      value,
    },
    state: { checked: isChecked, disabled: isDisabled, invalid, shortcut, type },
  }
}

function useInput({
  defaultValue,
  disabled = false,
  onChange,
  ref,
  type = "text",
  value,
}: {
  defaultValue?: React.ComponentProps<"input">["defaultValue"]
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  ref?: React.Ref<HTMLInputElement>
  type?: string
  value?: React.ComponentProps<"input">["value"]
}) {
  const {
    disabled: itemDisabled,
    invalid,
    name,
    registerAnswerControl,
    registerAnswerSelection,
    resetVersion,
    selectedAnswerIds,
    setAnswerDefault,
    setAnswerSelectionFromInteraction,
    syncControlledAnswerSelection,
  } = useItemContext("Questionnaire input")

  const id = React.useId()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const initialFilled = React.useRef(hasText(defaultValue))
  const controlled = value !== undefined
  const defaultFilled = hasText(defaultValue)
  const valueFilled = hasText(value)
  const [ownFilled, setOwnFilled] = React.useState(defaultFilled)
  const isDisabled = itemDisabled || disabled
  const filled = controlled ? valueFilled : ownFilled
  const selected = selectedAnswerIds.includes(id)

  React.useLayoutEffect(() => registerAnswerSelection(id, initialFilled.current), [id, registerAnswerSelection])

  React.useLayoutEffect(() => {
    setAnswerDefault(id, defaultFilled)
  }, [defaultFilled, id, setAnswerDefault])

  React.useLayoutEffect(() => {
    const element = inputRef.current
    if (!element) return
    return registerAnswerControl({ type: "input", id, element, disabled: isDisabled })
  }, [isDisabled, id, registerAnswerControl])

  React.useLayoutEffect(() => {
    if (controlled) {
      syncControlledAnswerSelection(id, valueFilled)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (resetVersion > 0) setOwnFilled(defaultFilled)
  }, [controlled, valueFilled, value, defaultFilled, id, resetVersion, syncControlledAnswerSelection])

  React.useLayoutEffect(() => {
    const element = inputRef.current
    if (!element || !controlled) return
    element.defaultValue = String(value)
  }, [controlled, value])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(event)
    if (event.defaultPrevented) return
    const nextFilled = event.target.value.trim().length > 0
    if (!controlled) {
      setOwnFilled(nextFilled)
      setAnswerSelectionFromInteraction(id, nextFilled)
    }
  }

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      assignRef(ref, node)
    },
    [ref]
  )

  return {
    inputProps: {
      "aria-invalid": invalid || undefined,
      "aria-keyshortcuts": keyShortcuts(null, !isDisabled && filled && selected),
      defaultValue: controlled ? undefined : defaultValue,
      disabled: isDisabled,
      form: selected ? undefined : "",
      id,
      name: selected ? name : undefined,
      onChange: handleChange,
      ref: setRef,
      type,
      value: controlled ? value : undefined,
    } as React.ComponentPropsWithRef<"input">,
    state: { disabled: isDisabled, filled, invalid },
  }
}

function useItem({
  "aria-describedby": ariaDescribedBy,
  "aria-keyshortcuts": ariaKeyShortcuts,
  disabled = false,
  invalid = false,
  multiple = false,
  name,
  onStatusChange,
  ref,
  required = false,
}: {
  "aria-describedby"?: string
  "aria-keyshortcuts"?: string
  disabled?: boolean
  invalid?: boolean
  multiple?: boolean
  name: string
  onStatusChange?: (status: ItemStatus) => void
  ref?: React.Ref<HTMLFieldSetElement>
  required?: boolean
}) {
  const { activeItemName, domVersion, first, last, nativeValidation, registerItem, shortcuts } =
    useRootContext("Questionnaire item")

  const [element, setElement] = React.useState<HTMLFieldSetElement | null>(null)
  const [answers, setAnswers] = React.useState<AnswerControl[]>([])
  const [attempted, setAttempted] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [skipped, setSkipped] = React.useState(false)
  const [resetVersion, setResetVersion] = React.useState(0)
  const [descriptionIds, setDescriptionIds] = React.useState<string[]>([])
  const [errorIds, setErrorIds] = React.useState<string[]>([])
  const defaultIds = React.useRef<string[]>([])
  const multipleRef = React.useRef(multiple)
  const previousMultiple = React.useRef(multiple)

  React.useLayoutEffect(() => {
    multipleRef.current = multiple
  })

  const active = !disabled && activeItemName === name

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sorted = React.useMemo(() => [...answers].sort(byDomOrder), [answers, domVersion])
  const enabled = React.useMemo(() => sorted.filter((answer) => !answer.disabled), [sorted])
  const hasSelection = enabled.some((answer) => selectedIds.includes(answer.id))
  const status: ItemStatus = skipped ? "skipped" : hasSelection ? "answered" : "unanswered"
  const skippedOptional = status === "skipped" && !required
  const satisfied = disabled || skippedOptional || (!invalid && status === "answered")
  const showInvalid = !disabled && !skippedOptional && (invalid || (attempted && !satisfied))
  const hasInputAnswer = enabled.some((answer) => answer.type === "input")
  const previousStatus = React.useRef(status)

  const shortcutByAnswerId = React.useMemo(() => {
    const keys = shortcutKeys(shortcuts)
    const choices = enabled.filter((answer) => answer.type === "choice")
    return new Map(choices.slice(0, keys.length).map((answer, index) => [answer.id, keys[index]]))
  }, [enabled, shortcuts])

  const registerAnswerControl = React.useCallback((control: AnswerControl) => {
    setAnswers((list) => [...list.filter((a) => a.element !== control.element && a.id !== control.id), control])
    return () => setAnswers((list) => list.filter((a) => a !== control))
  }, [])

  React.useLayoutEffect(() => {
    if (previousStatus.current === status) return
    previousStatus.current = status
    onStatusChange?.(status)
  }, [onStatusChange, status])

  const applySelection = React.useCallback(
    (id: string, selected: boolean) => {
      setSelectedIds((ids) =>
        selected ? (multiple ? (ids.includes(id) ? ids : [...ids, id]) : [id]) : ids.filter((x) => x !== id)
      )
    },
    [multiple]
  )

  const setAnswerSelectionFromInteraction = React.useCallback(
    (id: string, selected: boolean) => {
      setSkipped(false)
      applySelection(id, selected)
    },
    [applySelection]
  )

  const syncControlledAnswerSelection = React.useCallback(
    (id: string, selected: boolean) => {
      if (selected) setSkipped(false)
      applySelection(id, selected)
    },
    [applySelection]
  )

  const registerAnswerSelection = React.useCallback((id: string, selected: boolean) => {
    if (selected) {
      defaultIds.current = [...defaultIds.current.filter((x) => x !== id), id]
      setSelectedIds((ids) =>
        multipleRef.current ? (ids.includes(id) ? ids : [...ids, id]) : ids.length ? ids : [id]
      )
    }
    return () => {
      defaultIds.current = defaultIds.current.filter((x) => x !== id)
      setSelectedIds((ids) => ids.filter((x) => x !== id))
    }
  }, [])

  const setAnswerDefault = React.useCallback((id: string, selected: boolean) => {
    if (selected) {
      if (!defaultIds.current.includes(id)) defaultIds.current = [...defaultIds.current, id]
      return
    }
    defaultIds.current = defaultIds.current.filter((x) => x !== id)
  }, [])

  const registerDescription = React.useCallback((id: string) => {
    setDescriptionIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    return () => setDescriptionIds((ids) => ids.filter((x) => x !== id))
  }, [])

  const registerError = React.useCallback((id: string) => {
    setErrorIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    return () => setErrorIds((ids) => ids.filter((x) => x !== id))
  }, [])

  const validate = React.useCallback(() => {
    setAttempted(true)
    if (!satisfied) return false
    if (!nativeValidation) return true
    const failing = enabled.find(
      (answer) => isAnswered(answer) && answer.element.willValidate && !answer.element.validity.valid
    )
    if (!failing) return true
    failing.element.focus()
    failing.element.reportValidity()
    return false
  }, [enabled, nativeValidation, satisfied])

  const focus = React.useCallback(() => {
    element?.focus()
  }, [element])

  const focusInvalid = React.useCallback(() => {
    const filled = element?.querySelector<HTMLElement>("input[data-filled][name]:not(:disabled)")
    const field = element?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not(:disabled), textarea:not(:disabled)"
    )
    ;(filled ?? field ?? element)?.focus()
  }, [element])

  const reset = React.useCallback(() => {
    setAttempted(false)
    setSkipped(false)
    setSelectedIds(multiple ? [...defaultIds.current] : defaultIds.current.slice(0, 1))
    setResetVersion((v) => v + 1)
  }, [multiple])

  const skip = React.useCallback(() => {
    if (required) return
    setSelectedIds([])
    setSkipped(true)
  }, [required])

  React.useLayoutEffect(() => {
    const was = previousMultiple.current
    previousMultiple.current = multiple
    if (!was || multiple) return
    // Going single keeps only the first selected answer
    setSelectedIds((ids) => {
      const keep = enabled.find((answer) => ids.includes(answer.id))
      return keep ? [keep.id] : []
    })
  }, [enabled, multiple])

  const getAnswerByElement = React.useCallback(
    (target: Element) => enabled.find((answer) => answer.element === target) ?? null,
    [enabled]
  )

  const getAnswerByShortcut = React.useCallback(
    (shortcut: string) => {
      const id = Array.from(shortcutByAnswerId.entries()).find(([, key]) => key === shortcut)?.[0]
      return enabled.find((answer) => answer.id === id) ?? null
    },
    [enabled, shortcutByAnswerId]
  )

  const moveAnswerFocus = React.useCallback(
    (target: Element, direction: Direction) => {
      const index = enabled.findIndex((answer) => answer.element === target)
      const current = index < 0 ? null : (enabled[index] ?? null)
      if (!enabled.length || (isEditable(target) && !isEmptyTextInput(current)) || (index < 0 && target !== element)) {
        return false
      }
      const next =
        index < 0
          ? (enabled.find(isAnswered) ?? (direction === "next" ? enabled[0] : enabled[enabled.length - 1]))
          : enabled[(index + (direction === "next" ? 1 : -1) + enabled.length) % enabled.length]
      if (!next || next.element === target || (index >= 0 && isRadio(target) && isRadio(next.element))) {
        return false
      }
      next.element.focus()
      if (next.type === "choice" && isRadio(next.element)) next.element.click()
      return true
    },
    [enabled, element]
  )

  React.useLayoutEffect(() => {
    if (!element) return
    return registerItem({
      disabled,
      element,
      focus,
      focusInvalid,
      getAnswerByElement,
      getAnswerByShortcut,
      moveAnswerFocus,
      name,
      required,
      reset,
      skip,
      status,
      validate,
    })
  }, [
    disabled,
    element,
    focus,
    focusInvalid,
    getAnswerByElement,
    getAnswerByShortcut,
    moveAnswerFocus,
    name,
    registerItem,
    required,
    reset,
    skip,
    status,
    validate,
  ])

  const context = React.useMemo<ItemContextValue>(
    () => ({
      active,
      disabled,
      hasInputAnswer,
      invalid: showInvalid,
      multiple,
      name,
      registerAnswerControl,
      registerAnswerSelection,
      registerDescription,
      registerError,
      required,
      resetVersion,
      selectedAnswerIds: selectedIds,
      setAnswerDefault,
      setAnswerSelectionFromInteraction,
      shortcutByAnswerId,
      shortcuts,
      status,
      syncControlledAnswerSelection,
    }),
    [
      active,
      disabled,
      hasInputAnswer,
      showInvalid,
      multiple,
      name,
      registerAnswerControl,
      registerAnswerSelection,
      registerDescription,
      registerError,
      required,
      resetVersion,
      selectedIds,
      setAnswerDefault,
      setAnswerSelectionFromInteraction,
      shortcutByAnswerId,
      shortcuts,
      status,
      syncControlledAnswerSelection,
    ]
  )

  const setRef = React.useCallback(
    (node: HTMLFieldSetElement | null) => {
      setElement(node)
      assignRef(ref, node)
    },
    [ref]
  )

  const describedBy =
    [...descriptionIds, ...(showInvalid ? errorIds : []), ariaDescribedBy].filter(Boolean).join(" ") || undefined

  const keyshortcuts =
    [
      ariaKeyShortcuts,
      active ? "Meta+Enter Control+Enter" : undefined,
      active && enabled.length ? "ArrowUp ArrowDown" : undefined,
      active && !first ? "ArrowLeft" : undefined,
      active && !last && status !== "unanswered" ? "ArrowRight" : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined

  return {
    context,
    itemProps: {
      "aria-describedby": describedBy,
      "aria-invalid": showInvalid || undefined,
      "aria-keyshortcuts": keyshortcuts,
      disabled,
      hidden: !active,
      inert: !active,
      ref: setRef,
      tabIndex: -1,
    },
    state: { active, disabled, invalid: showInvalid, multiple, required, status },
  }
}

function useRoot({
  defaultItem,
  item,
  noValidate,
  onItemChange,
  onReset,
  onSubmit,
  ref,
  shortcuts,
}: {
  defaultItem?: string
  item?: string
  noValidate?: boolean
  onItemChange?: (item: string) => void
  onReset?: React.FormEventHandler<HTMLFormElement>
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  ref?: React.Ref<HTMLFormElement>
  shortcuts?: ShortcutMode
}) {
  const [registered, setRegistered] = React.useState<RegisteredItem[]>([])
  const [ownItem, setOwnItem] = React.useState<string | null>(defaultItem ?? null)
  const [form, setForm] = React.useState<HTMLFormElement | null>(null)
  const [domVersion, setDomVersion] = React.useState(0)
  const pending = React.useRef<{ name: string; target: "item" | "invalid" } | null>(null)
  const controlled = item !== undefined
  const currentName = controlled ? item : ownItem
  const previousName = React.useRef(currentName)
  const nativeValidation = noValidate === false
  const shortcutMode = shortcuts ?? null

  React.useLayoutEffect(() => {
    if (!form || typeof MutationObserver === "undefined") return
    const observer = new MutationObserver(() => setDomVersion((v) => v + 1))
    observer.observe(form, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [form])

  const items = React.useMemo(
    () => registered.filter((entry) => !entry.disabled).sort(byDomOrder),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [domVersion, registered]
  )
  const byName = React.useMemo(() => new Map(items.map((entry) => [entry.name, entry])), [items])
  const index = items.findIndex((entry) => entry.name === currentName)
  const activeItem = index < 0 || !currentName ? null : (byName.get(currentName) ?? null)
  const activeItemRequired = index < 0 ? null : (activeItem?.required ?? false)
  const activeItemStatus = index < 0 ? null : (activeItem?.status ?? (currentName ? "unanswered" : null))
  const total = items.length
  const current = index < 0 ? 0 : index + 1
  const first = total > 0 && index === 0
  const last = total > 0 && index === total - 1

  const goTo = React.useCallback(
    (name: string, target: "item" | "invalid" = "item") => {
      if (name === currentName) return
      pending.current = { name, target }
      if (!controlled) setOwnItem(name)
      onItemChange?.(name)
    },
    [currentName, controlled, onItemChange]
  )

  React.useLayoutEffect(() => {
    if (total === 0) return
    if (index < 0) {
      if (!controlled && currentName === null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOwnItem(items[0].name)
        return
      }
      goTo(items[0].name)
      return
    }
    const request = pending.current
    const changed = previousName.current !== currentName
    previousName.current = currentName
    if (!request || request.name !== currentName) {
      if (controlled && changed) {
        pending.current = null
        activeItem?.focus()
      }
      return
    }
    if (request.target === "invalid") activeItem?.focusInvalid()
    else activeItem?.focus()
    pending.current = null
  }, [activeItem, currentName, controlled, index, items, goTo, total])

  const registerItem = React.useCallback((entry: RegisteredItem) => {
    setRegistered((list) => [...list.filter((e) => e.element !== entry.element && e.name !== entry.name), entry])
    return () => setRegistered((list) => list.filter((e) => e !== entry))
  }, [])

  const goPrevious = React.useCallback(() => {
    if (index <= 0) return
    goTo(items[index - 1].name)
  }, [index, items, goTo])

  const goNext = React.useCallback(() => {
    if (!activeItem || index >= total - 1) return
    if (!activeItem.validate()) {
      activeItem.focusInvalid()
      return
    }
    goTo(items[index + 1].name)
  }, [activeItem, index, items, goTo, total])

  const advance = React.useCallback(() => {
    if (!activeItem) return
    if (!activeItem.validate()) {
      activeItem.focusInvalid()
      return
    }
    if (last) {
      form?.requestSubmit()
      return
    }
    goTo(items[index + 1].name)
  }, [activeItem, index, last, items, form, goTo])

  const skipCurrent = React.useCallback(() => {
    if (!activeItem || activeItem.required) return
    activeItem.skip()
    if (!last) {
      goTo(items[index + 1].name)
      return
    }
    queueMicrotask(() => form?.requestSubmit())
  }, [activeItem, index, last, items, form, goTo])

  function handleReset(event: React.FormEvent<HTMLFormElement>) {
    onReset?.(event)
    if (event.defaultPrevented) return
    for (const entry of registered) entry.reset()
    const target = items.find((entry) => entry.name === defaultItem)?.name ?? items[0]?.name
    if (target) goTo(target)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const failing = items.find((entry) => !entry.validate())
    if (failing) {
      event.preventDefault()
      goTo(failing.name, "invalid")
      if (failing.name === currentName) {
        failing.focusInvalid()
        pending.current = null
      }
      return
    }
    onSubmit?.(event)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229 ||
      !activeItem ||
      !(event.target instanceof Element)
    ) {
      return
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
      event.preventDefault()
      if (!event.repeat) advance()
      return
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (
      (event.key === "ArrowUp" || event.key === "ArrowDown") &&
      activeItem.moveAnswerFocus(event.target, event.key === "ArrowDown" ? "next" : "previous")
    ) {
      event.preventDefault()
      return
    }

    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !isEditable(event.target) && !isRadio(event.target)) {
      event.preventDefault()
      if (event.repeat) return
      if (event.key === "ArrowLeft") goPrevious()
      else if (activeItem.status !== "unanswered") goNext()
      return
    }

    if (event.key === "Enter") {
      const answer = activeItem.getAnswerByElement(event.target)
      if (!answer) return
      event.preventDefault()
      if (!event.repeat && isAnswered(answer)) advance()
      return
    }

    if (!shortcutMode || isEditable(event.target)) return
    const key = normalizeShortcutKey(event.key, shortcutMode)
    const answer = key ? activeItem.getAnswerByShortcut(key) : null
    if (answer) {
      event.preventDefault()
      if (!event.repeat) {
        answer.element.focus()
        if (answer.type === "choice") answer.element.click()
      }
    }
  }

  const state = { current, first, last, total }

  const context = React.useMemo<RootContextValue>(
    () => ({
      current,
      first,
      last,
      total,
      activeItemName: currentName,
      activeItemRequired,
      activeItemStatus,
      domVersion,
      goNext,
      goPrevious,
      nativeValidation,
      registerItem,
      shortcuts: shortcutMode,
      skipCurrent,
    }),
    [
      current,
      first,
      last,
      total,
      currentName,
      activeItemRequired,
      activeItemStatus,
      domVersion,
      goNext,
      goPrevious,
      nativeValidation,
      registerItem,
      shortcutMode,
      skipCurrent,
    ]
  )

  const setRef = React.useCallback(
    (node: HTMLFormElement | null) => {
      setForm(node)
      assignRef(ref, node)
    },
    [ref]
  )

  return {
    context,
    rootProps: {
      "data-shortcuts": shortcutMode ?? undefined,
      onKeyDown: handleKeyDown,
      onReset: handleReset,
      onSubmit: handleSubmit,
      ref: setRef,
    },
    state,
  }
}

// Parts

type RootProps = Omit<React.ComponentPropsWithRef<"form">, "defaultValue" | "value"> & {
  defaultItem?: string
  item?: string
  onItemChange?: (item: string) => void
  shortcuts?: ShortcutMode
}

function Root({
  defaultItem,
  item,
  noValidate = true,
  onItemChange,
  onReset,
  onSubmit,
  ref,
  shortcuts,
  ...props
}: RootProps) {
  const { context, rootProps, state } = useRoot({ defaultItem, item, noValidate, onItemChange, onReset, onSubmit, ref, shortcuts })
  const element = renderPart({
    tag: "form",
    props: mergeProps({ ...rootProps, noValidate }, props),
    state,
  })
  return <RootContext.Provider value={context}>{element}</RootContext.Provider>
}

function Progress({ children, render, ...props }: Part<"div", ProgressState>) {
  const { current, first, last, total } = useRootContext("Questionnaire progress")
  const text = total ? `Question ${current} of ${total}` : undefined
  return renderPart({
    tag: "div",
    props: mergeProps(
      {
        "aria-label": "Questionnaire progress",
        "aria-live": "polite",
        "aria-valuemax": total || undefined,
        "aria-valuemin": total ? 1 : undefined,
        "aria-valuenow": total ? current : undefined,
        "aria-valuetext": text,
        children: children ?? text,
        role: "progressbar",
      },
      props
    ),
    render,
    state: { current, first, last, total },
  })
}

type ItemProps = Omit<React.ComponentPropsWithRef<"fieldset">, "name" | "value"> & {
  invalid?: boolean
  name: string
  multiple?: boolean
  onStatusChange?: (status: ItemStatus) => void
  required?: boolean
}

function Item({
  "aria-describedby": ariaDescribedBy,
  "aria-keyshortcuts": ariaKeyShortcuts,
  children,
  disabled = false,
  invalid = false,
  multiple = false,
  name,
  onStatusChange,
  ref,
  required = false,
  ...props
}: ItemProps) {
  const { context, itemProps, state } = useItem({
    "aria-describedby": ariaDescribedBy,
    "aria-keyshortcuts": ariaKeyShortcuts,
    disabled,
    invalid,
    multiple,
    name,
    onStatusChange,
    ref,
    required,
  })
  const element = renderPart({
    tag: "fieldset",
    props: mergeProps({ ...itemProps, children }, props),
    state,
    mapping: { active: (value: boolean) => ({ "data-active": value ? "" : undefined }) },
  })
  return <ItemContext.Provider value={context}>{element}</ItemContext.Provider>
}

function Title({ render, ...props }: Part<"legend">) {
  useItemContext("Questionnaire title")
  return renderPart({ tag: "legend", props, render: render as React.ReactElement })
}

function Description({ id, render, ...props }: Part<"p">) {
  const { registerDescription } = useItemContext("Questionnaire description")
  const generated = React.useId()
  const resolved = id ?? generated
  React.useLayoutEffect(() => registerDescription(resolved), [resolved, registerDescription])
  return renderPart({ tag: "p", props: mergeProps({ id: resolved }, props), render: render as React.ReactElement })
}

function Choices({ render, ...props }: Part<"div", { shortcuts: ShortcutMode | null }>) {
  const { shortcuts } = useItemContext("Questionnaire choices")
  return renderPart({ tag: "div", props, render, state: { shortcuts } })
}

type ChoiceProps = Omit<Part<"label", ChoiceState>, "onChange"> & {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  value: string
}

function Choice({ checked, children, defaultChecked = false, disabled = false, onChange, render, value, ...props }: ChoiceProps) {
  const { inputProps, state } = useChoice({ checked, defaultChecked, disabled, onChange, value })
  const element = renderPart({
    tag: "label",
    props: mergeProps({ children }, props),
    render,
    state,
    mapping: checkedMapping,
  })
  return <ChoiceContext.Provider value={{ inputProps, state }}>{element}</ChoiceContext.Provider>
}

type ChoiceInputProps = Omit<
  Part<"input", ChoiceState>,
  "checked" | "defaultChecked" | "disabled" | "name" | "onChange" | "required" | "type" | "value"
>

function ChoiceInput({ render, ...props }: ChoiceInputProps) {
  const { inputProps, state } = useChoiceContext("Questionnaire choice input")
  return renderPart({
    tag: "input",
    props: mergeProps(inputProps as Record<string, unknown>, props),
    render,
    state,
    mapping: checkedMapping,
  })
}

function ChoiceLabel({ render, ...props }: Part<"span">) {
  useChoiceContext("Questionnaire choice label")
  return renderPart({ tag: "span", props, render: render as React.ReactElement })
}

function ChoiceShortcut({ children, render, ...props }: Part<"span", { shortcut: string | null }>) {
  const { state } = useChoiceContext("Questionnaire choice shortcut")
  return renderPart({
    tag: "span",
    props: mergeProps(
      { "aria-hidden": true, children: children ?? state.shortcut, hidden: state.shortcut === null },
      props
    ),
    render,
    state: { shortcut: state.shortcut },
  })
}

type InputType =
  | "date"
  | "datetime-local"
  | "email"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"

type InputProps = Omit<Part<"input", { disabled: boolean; filled: boolean; invalid: boolean }>, "form" | "name" | "type"> & {
  type?: InputType
}

function Input({ defaultValue, disabled = false, onChange, ref, render, type = "text", value, ...props }: InputProps) {
  const { inputProps, state } = useInput({ defaultValue, disabled, onChange, ref, type, value })
  return renderPart({
    tag: "input",
    props: mergeProps(inputProps as Record<string, unknown>, props),
    render,
    state,
    mapping: {
      filled: (filled: boolean) => ({ "data-empty": filled ? undefined : "", "data-filled": filled ? "" : undefined }),
    },
  })
}

function ErrorMessage({ children, id, render, ...props }: Part<"p", { invalid: boolean }>) {
  const { invalid, registerError, required } = useItemContext("Questionnaire error")
  const generated = React.useId()
  const resolved = id ?? generated
  React.useLayoutEffect(() => registerError(resolved), [resolved, registerError])
  return renderPart({
    tag: "p",
    props: mergeProps(
      {
        children: children ?? (required ? "Choose an answer to continue." : "Choose an answer or skip this question."),
        hidden: !invalid,
        id: resolved,
        role: invalid ? "alert" : undefined,
      },
      props
    ),
    render,
    state: { invalid },
  })
}

function NavButton({
  children,
  disabled,
  onClick,
  props,
  render,
  shortcut,
  status,
  tabIndex,
  type,
  visible,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  props: Record<string, unknown>
  render?: React.ReactElement | RenderFn<NavState>
  shortcut?: "Enter"
  status: ItemStatus | null
  tabIndex?: number
  type: "button" | "submit" | "reset"
  visible: boolean
}) {
  const key = visible && !disabled ? (shortcut ?? null) : null
  return renderPart<NavState>({
    tag: "button",
    props: mergeProps(
      {
        "aria-hidden": !visible || undefined,
        "aria-keyshortcuts": key ?? undefined,
        children,
        disabled,
        hidden: !visible,
        inert: !visible,
        onClick,
        tabIndex: visible ? tabIndex : -1,
        type,
      },
      props
    ),
    render,
    state: { disabled, shortcut: key, status, visible },
    mapping: {
      visible: (value: boolean) => ({ "data-hidden": value ? undefined : "", "data-visible": value ? "" : undefined }),
    },
  })
}

type NavProps = Part<"button", NavState>

function Previous({ children, disabled = false, onClick, render, tabIndex, type = "button", ...props }: NavProps) {
  const root = useRootContext("Questionnaire previous")
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (!event.defaultPrevented) root.goPrevious()
  }
  return NavButton({
    children: children ?? "Previous",
    disabled,
    onClick: handleClick,
    props,
    render,
    status: root.activeItemStatus,
    tabIndex,
    type,
    visible: root.total > 1 && !root.first,
  })
}

function Skip({ children, disabled = false, onClick, render, tabIndex, type = "button", ...props }: NavProps) {
  const root = useRootContext("Questionnaire skip")
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (!event.defaultPrevented) root.skipCurrent()
  }
  return NavButton({
    children: children ?? "Skip",
    disabled,
    onClick: handleClick,
    props,
    render,
    status: root.activeItemStatus,
    tabIndex,
    type,
    visible: root.activeItemRequired === false,
  })
}

function Next({ children, disabled = false, onClick, render, tabIndex, type = "button", ...props }: NavProps) {
  const root = useRootContext("Questionnaire next")
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (!event.defaultPrevented) root.goNext()
  }
  return NavButton({
    children: children ?? "Next",
    disabled,
    onClick: handleClick,
    props,
    render,
    shortcut: "Enter",
    status: root.activeItemStatus,
    tabIndex,
    type,
    visible: root.total > 1 && !root.last,
  })
}

function Submit({ children, disabled = false, render, tabIndex, type = "submit", ...props }: NavProps) {
  const root = useRootContext("Questionnaire submit")
  return NavButton({
    children: children ?? "Submit",
    disabled,
    props,
    render,
    shortcut: "Enter",
    status: root.activeItemStatus,
    tabIndex,
    type,
    visible: root.total > 0 && root.last,
  })
}

const HpxQuestionnairePrimitive = {
  Root,
  Progress,
  Item,
  Title,
  Description,
  Choices,
  Choice,
  ChoiceInput,
  ChoiceLabel,
  ChoiceShortcut,
  Input,
  Error: ErrorMessage,
  Previous,
  Skip,
  Next,
  Submit,
}

export { HpxQuestionnairePrimitive }
export type { ItemStatus as HpxQuestionnaireItemStatus, ShortcutMode as HpxQuestionnaireShortcutMode }
