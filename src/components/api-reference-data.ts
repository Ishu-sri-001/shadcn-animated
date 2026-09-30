// Only settings exposed by each component demo’s props remixer are listed.
// Keep names, groups, and descriptions in sync with the demo control schemas.
export type HpxApiProp = { name: string; label: string; type: string; default: string; description: string }
export type HpxApiGroup = { name: string; props: HpxApiProp[] }

export const apiReferences = {
  "accordion": [
    { name: "Accordion", props: [
      {"name":"multiple","type":"boolean","default":"false","description":"Whether multiple items can be open at the same time.\nTurn it off to keep a single item expanded when the user opens another item.","label":"Multiple open"},
      {"name":"openOnHover","type":"boolean","default":"false","description":"Opens one item on mouse hover and closes it when the pointer leaves.\nThe user can reveal content by moving the pointer over the trigger without clicking it. [Ignored when: value is supplied]","label":"Open on hover"},
      {"name":"bordered","type":"boolean","default":"false","description":"Adds a border and padding around the accordion.\nUse it to separate the component from the surrounding page with a visible outer boundary.","label":"Border"},
      {"name":"elastic","type":"boolean","default":"false","description":"Uses spring motion for panels, fills, and icons.\nOpening an item expands its panel with a soft spring, while closing it settles back into place.","label":"Elastic"},
    ] },
    { name: "Timing", props: [
      {"name":"duration","type":"number","default":"0.5","description":"Animation duration in seconds.\nIt controls how quickly the panel expands or collapses and how the item fill and icon move.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0.3","description":"Controls spring overshoot.\nHigher values move past the final position before settling; zero gives a firmer stop. [Ignored when: elastic=false]","label":"Bounce"},
      {"name":"delay","type":"number","default":"0.2","description":"Wait before panel content starts appearing, in seconds.\nIncrease it to leave a longer pause before the content becomes visible.","label":"Delay"},
      {"name":"stagger","type":"number","default":"0.05","description":"Delay between content children appearing, in seconds.\nA larger gap makes the sequence more noticeable; zero makes the items start together.","label":"Stagger"},
    ] },
    { name: "Item", props: [
      {"name":"fill","type":"\"muted\" | \"primary\" | false","default":"false","description":"Background color used for the animated item fill.\nThe color is revealed behind the item's content as its open state changes; primary also flips the text to the primary foreground.","label":"Fill"},
      {"name":"fillColor","type":"\"muted\" | \"primary\"","default":"\"muted\"","description":"Chooses which theme color the item fill uses.\nMuted is a soft neutral background, while primary is a strong solid fill. [Ignored when: fill=false]","label":"Fill colour"},
      {"name":"rounded","type":"string","default":"\"rounded-none\"","description":"Tailwind corner-radius class for the item, such as rounded-lg.\nThe class controls the item outline and the shape of its animated background.","label":"Roundness"},
      {"name":"showLine","type":"boolean","default":"true","description":"Draws a line under the trigger while the item is open.\nThe line animates in with the open state and retracts when the item is closed.","label":"Show line"},
    ] },
    { name: "Heading", props: [
      {"name":"icon","type":"\"chevron\" | \"plus\"","default":"\"plus\"","description":"Chooses a rotating chevron or a plus that changes on opening.\nThe icon changes direction or shape to indicate whether the associated panel is expanded.","label":"Icon"},
    ] },
  ],
  "attachment": [
    { name: "Adding", props: [
      {"name":"animateEnter","type":"boolean","default":"true","description":"Animates the item when it first appears.\nTurn it off when new items should appear immediately without an entrance transition.","label":"Animate enter"},
      {"name":"stagger","type":"Demo control","default":"0.08","description":"Delays newly added attachments one after another, in seconds.\nA larger gap makes a batch appear more gradually; zero starts them together. [Ignored when: animateEnter=false]","label":"Stagger"},
      {"name":"flyIn","type":"Demo control","default":"true","description":"Makes new attachments fly in from their recorded drop position.\nTurn it off to use the normal entrance animation instead.","label":"Fly in from drop"},
      {"name":"animatedBorder","type":"boolean","default":"true","description":"Animates the border while files are dragged over the dropzone.\nThe moving outline gives feedback that the dropzone is ready to accept the files.","label":"Animated border"},
    ] },
    { name: "Layout", props: [
      {"name":"animateExit","type":"boolean","default":"true","description":"Animates removal when wrapped in AnimatePresence.\nThe item stays visible long enough to finish its exit motion before being removed.","label":"Animate exit"},
    ] },
    { name: "Progress", props: [
      {"name":"rollingNumbers","type":"boolean","default":"true","description":"Rolls the digits when the percentage changes.\nTurning it off replaces the number immediately instead of animating each changing digit.","label":"Rolling numbers"},
      {"name":"shimmerText","type":"boolean","default":"true","description":"Shimmers the filename while uploading or processing.\nThe moving highlight gives the filename a subtle busy state while the file is being prepared. [Ignored when: state=\"done\", state=\"error\"]","label":"Shimmer text"},
      {"name":"borderTrace","type":"boolean","default":"true","description":"Animates a line around the border during upload or processing.\nThe moving outline shows that background work is still in progress. [Ignored when: state=\"done\", state=\"error\"]","label":"Border trace"},
      {"name":"fill","type":"boolean","default":"true","description":"Shows upload progress as a background fill.\nAs progress changes, the colored background covers a matching portion of the attachment. [Ignored when: state=\"done\", state=\"error\"]","label":"Card fill (images)"},
      {"name":"fillDirection","type":"\"left-to-right\" | \"bottom-to-top\"","default":"\"bottom-to-top\"","description":"Direction in which the progress background fills.\nChoose a horizontal fill from the left or a vertical fill from the bottom. [Ignored when: fill=false]","label":"Fill direction"},
    ] },
    { name: "States", props: [
      {"name":"shakeOnError","type":"boolean","default":"true","description":"Shakes once when the attachment changes to the error state.\nThe brief side-to-side movement draws attention to a newly failed operation.","label":"Shake on error"},
    ] },
    { name: "Hover", props: [
      {"name":"revealAction","type":"boolean","default":"true","description":"Shows the action on attachment hover or keyboard focus.\nThe action also becomes available through keyboard focus, so it does not rely on mouse hover alone.","label":"Reveal action"},
      {"name":"zoomOnHover","type":"boolean","default":"true","description":"Zooms the image on hover.\nThe thumbnail grows slightly within its container while the pointer is over it. [Ignored when: variant=\"icon\"]","label":"Zoom on hover"},
      {"name":"blurUntilLoaded","type":"boolean","default":"true","description":"Reveals the image as processing finishes.\nThis creates a transition from the processing appearance to the finished image preview. [Ignored when: variant=\"icon\"]","label":"Blur until loaded"},
    ] },
    { name: "Group", props: [
      {"name":"reorder","type":"boolean","default":"true","description":"Enables drag reordering.\nUsers can move an item by dragging it, and neighboring items shift to make room. [Ignored when: values is missing, onReorder is missing]","label":"Drag to reorder"},
      {"name":"tiltOnScroll","type":"boolean","default":"false","description":"Leans the attachments with horizontal movement.\nThe attachments briefly lean as their horizontal position changes, then return upright.","label":"Tilt on scroll"},
      {"name":"wrap","type":"boolean","default":"false","description":"Wraps attachments onto multiple lines instead of a horizontal strip.\nTurn it off to keep the attachments together in a single horizontal row.","label":"Wrap"},
      {"name":"expandable","type":"Demo control","default":"true","description":"Lets users click an image thumbnail to open a larger preview.\nTurn it off to keep images inside their attachment cards. [Ignored for: non-image files]","label":"Expandable preview"},
    ] },
    { name: "Demo", props: [
      {"name":"simulateFailures","type":"Demo control","default":"true","description":"Randomly makes some demo uploads fail so you can try the error state.\nTurn it off for successful uploads; retrying a failed upload always succeeds.","label":"Simulate failures"},
    ] },
  ],
  "bubble": [
    { name: "Arriving", props: [
      {"name":"animateEnter","type":"boolean","default":"true","description":"Animates the item when it first appears.\nTurn it off when new items should appear immediately without an entrance transition.","label":"Animate enter"},
      {"name":"typing","type":"boolean","default":"true","description":"Shows typing dots in place of message content.\nTurn it off when the response is ready to replace the dots with the actual message. [Ignored when: render is supplied]","label":"Typing indicator"},
      {"name":"streamText","type":"Demo control","default":"false","description":"Reveals incoming reply text word by word instead of showing it all at once.\nThe message bubble grows as more text becomes visible.","label":"Stream text"},
    ] },
    { name: "Sending", props: [
      {"name":"flyIn","type":"Demo control","default":"false","description":"Makes a sent message fly from the message input into the conversation.\nThe demo records the input's position and uses it as the bubble's entrance origin.","label":"Fly from input"},
      {"name":"showDeliveryStatus","type":"Demo control","default":"true","description":"Shows delivery feedback for the latest outgoing message and failed messages.\nTurn it off to hide these status icons without changing message delivery.","label":"Show delivery status"},
      {"name":"shakeOnError","type":"boolean","default":"true","description":"Shakes when the variant changes to destructive.\nThe brief side-to-side movement draws attention to a newly failed operation. [Ignored when: variant is not \"destructive\"]","label":"Shake on error"},
      {"name":"simulateFailures","type":"Demo control","default":"true","description":"Randomly fails some outgoing demo messages so you can try retrying them.\nTurn it off when messages should always send successfully.","label":"Simulate failures"},
    ] },
    { name: "Reactions", props: [
      {"name":"popOnChange","type":"boolean","default":"true","description":"Scales the reaction pill in and pulses it when the count changes.\nThis draws attention to new reactions and changes in their count.","label":"Pop on change"},
      {"name":"rollingNumbers","type":"boolean","default":"true","description":"Rolls the count digits as they change.\nTurning it off replaces the number immediately instead of animating each changing digit. [Ignored when: count is missing]","label":"Rolling numbers"},
      {"name":"doubleClickToReact","type":"Demo control","default":"true","description":"Lets a double-click add or remove a heart reaction on a message.\nTurn it off to prevent that gesture from changing reactions.","label":"Double click to react"},
      {"name":"showReactionPicker","type":"boolean","default":"true","description":"Shows the reaction picker on hover or long press.\nThe available emojis come from reactions, and choosing one calls onReact. [Ignored when: onReact is missing]","label":"Show reaction picker"},
      {"name":"magnifyEmojis","type":"boolean","default":"false","description":"Enlarges picker emojis near the pointer.\nThe emoji closest to the pointer grows larger to make the current target easier to identify. [Ignored when: showReactionPicker=false, onReact is missing]","label":"Magnify emojis"},
    ] },
    { name: "Interaction", props: [
      {"name":"liftOnHover","type":"boolean","default":"false","description":"Lifts on hover and gently compresses on press.\nMoving the pointer away or releasing the press returns the message to its original position.","label":"Lift on hover"},
      {"name":"selectable","type":"boolean","default":"true","description":"Allows message text to be selected while preserving swipe gestures.\nUsers can drag over message text to copy it without treating every text selection as a reply swipe.","label":"Selectable text"},
      {"name":"swipeToReply","type":"Demo control","default":"true","description":"Lets users swipe a message to start a reply to it.\nCrossing the swipe threshold selects that message in the reply composer.","label":"Swipe to reply"},
      {"name":"showSuggestions","type":"Demo control","default":"true","description":"Shows suggested replies when an incoming response has finished.\nChoosing a suggestion sends it as a new message.","label":"Show suggestions"},
      {"name":"collapsible","type":"Demo control","default":"true","description":"Shortens long messages and adds a Show more control.\nUsers can expand the complete message and collapse it again afterward.","label":"Collapsible"},
    ] },
    { name: "Grouping", props: [
      {"name":"joined","type":"boolean","default":"false","description":"Joins adjacent bubble corners to visually group messages.\nUse it for consecutive messages from the same sender so they read as one connected group.","label":"Joined corners"},
    ] },
  ],
  "button": [
    { name: "Effect", props: [
      {"name":"variant","type":"\"link\" | \"dot-fill\" | \"char-stagger\" | \"scramble\" | \"border-draw\"","default":"\"dot-fill\"","description":"Chooses dot fill, character roll, scramble, link underline, or border drawing.\nThe chosen effect responds to hover, such as filling the surface or animating the label's letters.","label":"Hover effect"},
      {"name":"surface","type":"\"filled\" | \"outline\" | \"plain\"","default":"\"filled\"","description":"Chooses a filled, outlined, or plain surface.\nThis changes the button's base background and border treatment beneath its hover animation. [Ignored when: variant=\"link\"]","label":"Background"},
      {"name":"tone","type":"\"destructive\" | \"muted\" | \"primary\" | \"success\" | \"warning\" | \"info\" | \"gradient\"","default":"\"primary\"","description":"Sets the button and hover-fill colors.\nChoose the color treatment that matches the meaning or emphasis of this item.","label":"Colour"},
      {"name":"underline","type":"boolean","default":"true","description":"Draws a hover underline for plain surfaces; link always has one.\nTurn it off to remove the extra hover line from a plain button. [Ignored when: surface=\"filled\", surface=\"outline\", variant=\"link\"]","label":"Line under text (plain)"},
      {"name":"rollingText","type":"boolean","default":"true","description":"Rolls the label on hover.\nThe current text moves out while an identical copy moves in, keeping the label readable. [Ignored when: variant=\"char-stagger\", variant=\"scramble\"]","label":"Rolling text"},
      {"name":"shimmerText","type":"boolean","default":"false","description":"Sweeps a bright band across the label.\nThe highlight repeats across the text to add motion without changing the label itself. [Ignored when: variant=\"char-stagger\", variant=\"scramble\"]","label":"Shimmer text"},
      {"name":"pressFeedback","type":"boolean","default":"true","description":"On click the button scales down, then springs back.\nReleasing the button brings it back to its original scale with a spring.","label":"Press feedback"},
      {"name":"magnetic","type":"boolean","default":"false","description":"The button leans toward the pointer.\nAs the pointer moves within the button, the button gently shifts toward it.","label":"Magnetic"},
    ] },
    { name: "State", props: [
      {"name":"showLoadingState","type":"Demo control","default":"false","description":"Makes clicking the demo button run a loading and success sequence.\nThe spinner changes to a success check before the button returns to idle.","label":"Show loading state"},
    ] },
    { name: "Icon", props: [
      {"name":"icon","type":"\"search\" | \"none\" | \"arrow\" | \"settings\"","default":"\"arrow\"","description":"Icon shown beside the label; loading and success states replace it.\nChoose the symbol for the button's idle state; status feedback takes its place during an action.","label":"Icon"},
      {"name":"iconPosition","type":"\"start\" | \"end\"","default":"\"end\"","description":"Places the icon before or after the label.\nUse start for an icon before the text or end for an icon after it.","label":"Icon position"},
    ] },
    { name: "Style", props: [
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"full\" | \"sm\"","default":"\"full\"","description":"Corner roundness of the button.\nThe dot fill and border draw are clipped or drawn to the same shape.","label":"Roundness"},
    ] },
    { name: "Motion", props: [
      {"name":"duration","type":"number","default":"0.55","description":"Sets the hover animation length, in seconds.\nIt drives whichever hover effect is selected (dot fill, letter roll, scramble, border draw or line draw) and the text colour change that goes with it.","label":"Duration"},
      {"name":"stagger","type":"number","default":"0.02","description":"Delay between letters rolling, in seconds.\nA larger gap makes the sequence more noticeable; zero makes the items start together. [Ignored when: variant is not \"char-stagger\"]","label":"Stagger"},
    ] },
  ],
  "checkbox": [
    { name: "Style", props: [
      {"name":"variant","type":"\"default\" | \"card\"","default":"\"default\"","description":"Chooses the visual style.\nDefault keeps the options compact, while card gives each option its own larger selectable area.","label":"Style"},
      {"name":"cardFillColor","type":"\"muted\" | \"primary\"","default":"\"muted\"","description":"Color of a selected card.\nThe selected card uses either a quieter muted background or the stronger primary color. [Ignored when: variant=\"default\"]","label":"Card fill color"},
      {"name":"showIcon","type":"boolean","default":"true","description":"Shows the selection control beside the label.\nTurning it off removes the optional icon while leaving the text and interaction available.","label":"Icon"},
    ] },
    { name: "Ticking", props: [
      {"name":"fill","type":"boolean","default":"true","description":"Animates the selected box and card background filling in.\nWhen disabled, the selected background changes immediately instead of growing into place.","label":"Fill from centre"},
      {"name":"elastic","type":"boolean","default":"true","description":"Bounces the selection control when checked or pressed.\nThe selected checkbox briefly compresses and springs back to emphasize the change. [Ignored when: showIcon=false]","label":"Elastic"},
    ] },
    { name: "Box", props: [
      {"name":"mark","type":"\"check\" | \"circle-filled\" | \"circle-outline\"","default":"\"check\"","description":"Chooses the check or circle inside a selected box.\nUse the indicator style that best fits your design while retaining multiple-choice behavior. [Ignored when: showIcon=false]","label":"Mark"},
      {"name":"appearance","type":"\"filled\" | \"outline\"","default":"\"filled\"","description":"Filled or outline box.\nThis changes the selected control's visual treatment while keeping its selection behavior.","label":"Look"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"full\" | \"sm\" | \"xs\"","default":"\"sm\"","description":"Corner roundness of the checkbox box. [Ignored when: showIcon=false]","label":"Roundness"},
    ] },
    { name: "Label", props: [
      {"name":"strike","type":"boolean","default":"false","description":"Draws a line through checked item labels.\nThe line appears when an option is checked and retracts when it is unchecked.","label":"Strike-through"},
    ] },
    { name: "Multiple select", props: [
      {"name":"showSelectAll","type":"boolean","default":"true","description":"Shows an action to select enabled items, up to max.\nThe action skips disabled items and stops when the selection reaches the configured maximum.","label":"Show select all"},
      {"name":"showDeselectAll","type":"boolean","default":"true","description":"Shows an action to clear the selection.\nClicking the action unchecks the currently selected options in the group.","label":"Show deselect all"},
      {"name":"showCounter","type":"boolean","default":"true","description":"Shows the number of selected items.\nWhen max is supplied, the counter also shows how many selections are allowed.","label":"Show counter"},
      {"name":"rangeSelect","type":"boolean","default":"true","description":"Enables selecting a range with Shift-click.\nSelect one option, then Shift-click another to toggle the options between them.","label":"Shift-click ranges"},
      {"name":"min","type":"number","default":"\"0\"","description":"Shows a validation message when fewer than this many items are selected.\nThe selection can fall below this number, but the group displays feedback asking for more choices.","label":"At least"},
      {"name":"max","type":"number","default":"\"any\"","description":"Prevents selecting more than this many items.\nThe group blocks additional selections at this limit until an existing selection is cleared.","label":"At most"},
      {"name":"reorder","type":"boolean","default":"false","description":"Allows items to be dragged into a new order.\nUsers can move an item by dragging it, and neighboring items shift to make room.","label":"Drag to reorder"},
      {"name":"colorful","type":"Demo control","default":"false","description":"Gives each option its own accent color when selected.\nTurn it off to use the shared theme color for every option.","label":"Colour per option"},
    ] },
  ],
  "command": [
    { name: "Dropdown", props: [
      {"name":"dropdownAnimation","type":"\"fade\" | \"slide\" | \"morph\"","default":"\"morph\"","description":"Morphs the search bar into results, or opens a sliding or fading panel.\nThe selected effect runs when the search results open beneath the input.","label":"Dropdown animation"},
      {"name":"morphWidth","type":"number","default":"1.25","description":"Result-panel width relative to the search bar.\nA value above 1 lets the results panel grow wider than the closed search field. [Ignored when: dropdownAnimation=\"slide\", dropdown=\"fade\"]","label":"Morph width"},
    ] },
    { name: "Palette", props: [
      {"name":"delay","type":"number","default":"0.15","description":"Wait, in seconds, before items start fading in after the palette or dropdown opens.\nThe box itself opens immediately; only the item stagger waits, so it only matters while staggerItems is on. [Ignored when: staggerItems=false]","label":"Delay"},
      {"name":"fadeContent","type":"boolean","default":"true","description":"Fades the palette's opacity in and out while it scales.\nOff keeps the palette fully opaque during the scaling. It changes the palette only, not the dropdown.","label":"Fade content"},
      {"name":"startScale","type":"number","default":"0.75","description":"Size, 0.5–1, the palette grows from when it opens.\nFor example, 0.75 starts it at three-quarters size. It changes the palette only, not the dropdown.","label":"Start scale"},
      {"name":"backdrop","type":"\"none\" | \"dim\" | \"blur\"","default":"\"blur\"","description":"Chooses a clear, dimmed, or blurred background behind the panel.\nA dim or blurred background helps focus attention on the open panel.","label":"Backdrop"},
    ] },
    { name: "Both", props: [
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"3xl\" | \"sm\"","default":"\"sm\"","description":"Corner roundness of the palette and the dropdown box, and of the item highlight inside them.\nThe search bar in its closed state keeps the same shape.","label":"Roundness"},
      {"name":"itemHighlight","type":"\"none\" | \"slide\" | \"fill\"","default":"\"slide\"","description":"slide: one highlight glides between items.\nFill animates each row's background, while none removes the custom hover effect.","label":"Item highlight"},
      {"name":"itemHighlightColor","type":"\"muted\" | \"primary\"","default":"\"primary\"","description":"Color of the item highlight.\nMuted keeps the hover state subtle; primary makes the targeted result more prominent. [Ignored when: itemHighlight=\"none\"]","label":"Item highlight color"},
      {"name":"rollingText","type":"boolean","default":"false","description":"Rolls the option label upward when highlighted with the pointer or keyboard.\nTurn it off to keep labels still while navigating commands.","label":"Rolling text"},
      {"name":"animateIcon","type":"boolean","default":"true","description":"Search icon tilts and grows on hover and focus.\nThe small icon response helps indicate that the search field is ready for input.","label":"Animate icon"},
      {"name":"duration","type":"number","default":"0.35","description":"Sets how long the palette and the dropdown take to open and close, in seconds.\nIt also times the item highlight glide, the search icon motion and how long each item takes to fade in, so it changes both surfaces together.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0.15","description":"Spring overshoot, 0–1, shared by the palette and the dropdown.\nIt affects the palette scaling in, the dropdown morphing or sliding open and the item highlight glide; the search icon always keeps at least a little bounce. Zero gives a firm stop.","label":"Bounce"},
      {"name":"staggerItems","type":"boolean","default":"true","description":"Items fade in one after another.\nTurning it off makes the results appear together without the per-item entrance sequence.","label":"Stagger items"},
      {"name":"stagger","type":"number","default":"0.03","description":"Gap in seconds between one item appearing and the next, in both the palette and the dropdown list.\nA larger gap makes the list build more slowly; zero starts every item together. [Ignored when: staggerItems=false]","label":"Stagger"},
    ] },
  ],
  "date-picker": [
    { name: "Trigger", props: [
      {"name":"showIcon","type":"boolean","default":"true","description":"Shows the animated calendar icon on the trigger.\nTurning it off removes the optional icon while leaving the text and interaction available.","label":"Icon"},
      {"name":"rollingText","type":"boolean","default":"true","description":"Rolls the trigger label when the selected date changes.\nThe old date label slides away and the new one enters instead of changing instantly.","label":"Rolling text"},
      {"name":"dateFormat","type":"string","default":"\"PPP\"","description":"date-fns format used for the selected date label.\nFor example, a different format can show a shorter numeric date instead of a written month name.","label":"Format"},
    ] },
    { name: "Popup", props: [
      {"name":"fromBehind","type":"boolean","default":"true","description":"Opens the calendar visually behind the trigger button.\nThe calendar appears underneath the button's layer, making the opening feel connected to it.","label":"From behind trigger"},
      {"name":"contentAnimation","type":"\"scale\" | \"fade\"","default":"\"scale\"","description":"Chooses a scale or fade entrance for the calendar content.\nScale grows the content into place, while fade changes its opacity without resizing it.","label":"Content animation"},
      {"name":"startScale","type":"number","default":"0.9","description":"Starting size of the calendar content.\nA value below 1 makes the calendar start smaller and grow to its full size as it opens. [Ignored when: contentAnimation=\"fade\"]","label":"Start scale"},
      {"name":"closeOnSelect","type":"boolean","default":"true","description":"Closes the calendar after selecting a date.\nTurn it off to leave the calendar visible after choosing a date.","label":"Close on select"},
    ] },
    { name: "Month change", props: [
      {"name":"captionLayout","type":"\"label\" | \"dropdown\" | \"dropdown-months\" | \"dropdown-years\"","default":"\"dropdown\"","description":"Chooses a plain month label or month/year dropdowns.\nDropdowns let users jump to a month or year instead of stepping through each month.","label":"Header"},
      {"name":"yearsBefore","type":"number","default":"10","description":"Number of years before the current year available to navigate.\nFor example, 10 makes the calendar's navigation range begin ten years before this year.","label":"Years before"},
      {"name":"yearsAfter","type":"number","default":"10","description":"Number of years after the current year available to navigate.\nFor example, 10 extends the calendar's navigation range ten years beyond this year.","label":"Years after"},
      {"name":"monthAnimation","type":"\"none\" | \"fade\" | \"slide\"","default":"\"slide\"","description":"Slides, fades, or instantly replaces the month grid.\nThe effect runs when the displayed month changes using arrows or the month/year controls.","label":"Month animation"},
      {"name":"monthSlideDistance","type":"number","default":"40","description":"Month-slide distance as a percentage of the grid width.\nIncrease it to make the incoming and outgoing month grids travel farther across the calendar. [Ignored when: monthAnimation=\"fade\", monthTransition=\"none\"]","label":"Slide distance"},
      {"name":"slideArrows","type":"boolean","default":"true","description":"Slides the previous/next arrow icons on hover.\nThe current arrow moves out and a matching arrow slides into its place.","label":"Slide arrows"},
    ] },
    { name: "Date hover", props: [
      {"name":"hoverVariant","type":"\"filled\" | \"outline\"","default":"\"filled\"","description":"Uses a filled or outlined hover highlight on dates and dropdown options.\nFilled colors the hovered date; outline draws a border around it.","label":"Variant"},
      {"name":"hoverAnimation","type":"\"fade\" | \"slide\"","default":"\"slide\"","description":"Slides the hover highlight or fades it between items.\nSlide moves the highlight between targets, while fade changes its opacity in place.","label":"Hover animation"},
      {"name":"hoverDuration","type":"number","default":"0.25","description":"Duration of the hover highlight movement or fade, in seconds.\nIncrease it for a slower hover transition or reduce it for a faster response.","label":"Glide duration"},
      {"name":"hoverBounce","type":"number","default":"0.15","description":"Spring overshoot of the hover highlight.\nA higher value lets the moving highlight overshoot slightly before settling on the target. [Ignored when: hoverAnimation=\"fade\"]","label":"Glide bounce"},
    ] },
    { name: "Calendar", props: [
      {"name":"weekStartsOn","type":"0 | 1 | 2 | 3 | 4 | 5 | 6","default":"\"0\"","description":"First day of the week: 0 is Sunday, 1 is Monday, through 6 for Saturday.\nChanging it reorders the weekday headings and the dates beneath them.","label":"Week starts"},
      {"name":"onlyCurrentMonth","type":"boolean","default":"true","description":"Hides dates belonging to the previous and next months.\nTurn it off to also show neighboring months' dates at the edges of the grid.","label":"Only current month"},
      {"name":"fixedWeeks","type":"boolean","default":"true","description":"Keeps the calendar grid at six weeks high.\nThis prevents the calendar from changing height between shorter and longer months.","label":"Fixed 6 weeks"},
      {"name":"disablePast","type":"boolean","default":"false","description":"Prevents selecting dates before today.\nToday and future dates remain available, while earlier days cannot be picked.","label":"Disable past dates"},
      {"name":"highlightToday","type":"boolean","default":"false","description":"Highlights today's date in the calendar.\nThis helps users find the current day independently of the date they have selected.","label":"Highlight today"},
    ] },
  ],
  "dialog": [
    { name: "Button", props: [
      {"name":"rollingText","type":"boolean","default":"true","description":"Trigger text rolls up on hover.\nThe current text moves out while an identical copy moves in, keeping the label readable.","label":"Rolling text"},
      {"name":"fillOnHover","type":"boolean","default":"false","description":"Trigger fills from pointer on hover.\nA background fill grows from the pointer position to give the trigger a hover response.","label":"Fill on hover"},
    ] },
    { name: "Opening", props: [
      {"name":"originFromTrigger","type":"boolean","default":"true","description":"Grow from and back into trigger.\nThe dialog grows from the recorded trigger position when opened and returns toward it when closed.","label":"Origin from trigger"},
      {"name":"elastic","type":"boolean","default":"true","description":"Opens the dialog box with a spring instead of a fixed-length ease.\nTurn it off for smooth easing with no overshoot; it only affects how the box grows in, not the content fade.","label":"Elastic"},
      {"name":"duration","type":"number","default":"0.35","description":"How long the dialog box takes to open, in seconds.\nWith elastic on, closing plays at about 80% of this; the backdrop and content fade follow the box.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0.2","description":"Spring overshoot of the dialog box as it opens, from 0 to 1.\nHigher values move past the final size before settling; zero gives a firmer stop. [Ignored when: elastic=false]","label":"Bounce"},
      {"name":"fadeContent","type":"boolean","default":"true","description":"Content fades in after the box.\nThe container appears first, then its contents become visible with a short fade.","label":"Fade content"},
      {"name":"scaleContent","type":"boolean","default":"false","description":"Grows inner content from 80% while it fades in.\nEach content block grows to full size while the dialog's fadeContent effect reveals it. [Ignored when: fadeContent=false]","label":"Scale content"},
    ] },
    { name: "Closing", props: [
      {"name":"exitAnimation","type":"\"fade\" | \"drop\" | \"shrink\"","default":"\"fade\"","description":"Chooses the exit motion.\nThis controls how the dialog leaves the screen after it is dismissed. [Ignored when: originFromTrigger=true and a trigger origin was recorded]","label":"Exit animation"},
      {"name":"fadeContentOut","type":"boolean","default":"true","description":"Content fades out before closing.\nThe inner content disappears before the surrounding dialog finishes its exit motion.","label":"Fade content out"},
      {"name":"dismissible","type":"boolean","default":"true","description":"Allows outside clicks to close the dialog.\nTurn it off when an outside click should leave the dialog open. [Overridden by: disablePointerDismissal]","label":"Click outside closes"},
      {"name":"shakeOnBlock","type":"boolean","default":"true","description":"Shakes the dialog when an outside click is blocked.\nThe movement signals that the outside click did not dismiss the dialog. [Ignored when: dismissible=true]","label":"Shake when blocked"},
    ] },
    { name: "Style", props: [
      {"name":"backdrop","type":"\"none\" | \"dim\" | \"blur\"","default":"\"blur\"","description":"Chooses a clear, dimmed, or blurred background behind the panel.\nA dim or blurred background helps focus attention on the open panel.","label":"Backdrop"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"3xl\" | \"sm\"","default":"\"xl\"","description":"Corner roundness of the dialog box.\nThe content inside is clipped to the same shape.","label":"Roundness"},
    ] },
  ],
  "drawer": [
    { name: "Button", props: [
      {"name":"rollingText","type":"boolean","default":"true","description":"Trigger text rolls up on hover.\nThe current text moves out while an identical copy moves in, keeping the label readable.","label":"Rolling text"},
      {"name":"fillOnHover","type":"boolean","default":"false","description":"Trigger fills from pointer on hover.\nA background fill grows from the pointer position to give the trigger a hover response.","label":"Fill on hover"},
    ] },
    { name: "Drawer", props: [
      {"name":"side","type":"Demo control","default":"\"bottom\"","description":"Chooses the screen edge from which the drawer opens.\nThe demo sets the matching swipe direction so users can drag it back toward that edge.","label":"Side"},
      {"name":"showSwipeHandle","type":"boolean","default":"true","description":"Shows the drag handle inside the drawer.\nThe handle gives users a visual cue that the drawer supports dragging.","label":"Swipe handle"},
    ] },
    { name: "Motion", props: [
      {"name":"openAnimation","type":"\"fade\" | \"slide\"","default":"\"slide\"","description":"Slide in, or fade in place.\nSlide moves the drawer from its screen edge, while fade reveals it without that travel.","label":"Opens with"},
      {"name":"elastic","type":"boolean","default":"true","description":"Uses spring easing for the slide.\nTurning it off uses smooth easing without the spring-like settling motion. [Ignored when: openAnimation=\"fade\"]","label":"Elastic"},
      {"name":"duration","type":"number","default":"0.5","description":"How long the drawer takes to slide open and closed, in seconds.\nItems inside wait 30% of it before fading in, and the page scaling behind the drawer uses the same length.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0.2","description":"Spring overshoot of the drawer slide, from 0 to 0.9.\nIt only affects the drawer panel movement, not the item fade. [Ignored when: elastic=false, openAnimation=\"fade\"]","label":"Bounce"},
      {"name":"stagger","type":"number","default":"0.04","description":"Gap between items inside the drawer fading in after it opens, in seconds.\nZero makes the items appear together.","label":"Stagger"},
      {"name":"tiltOnSwipe","type":"boolean","default":"false","description":"Tilts a little while swiped.\nThe panel rotates slightly during a swipe instead of moving in a perfectly straight line.","label":"Tilt on swipe"},
      {"name":"scaleBackground","type":"Demo control","default":"true","description":"Shrinks and rounds the demo's background while the drawer is open.\nClosing the drawer returns that content to its original size and shape.","label":"Shrink page behind"},
    ] },
  ],
  "dropdown-menu": [
    { name: "Panel", props: [
      {"name":"animation","type":"\"scale\" | \"slide\" | \"collapse\" | \"reveal\" | \"morph\"","default":"\"collapse\"","description":"How the panel opens and closes.\nCollapse reveals the panel's height, while the other modes change its entrance and exit motion.","label":"Animation"},
      {"name":"exitFast","type":"boolean","default":"false","description":"Close in 60% of the open time, without staggering items out.\nUse it when opening should feel deliberate but closing should finish quickly.","label":"Exit fast"},
    ] },
    { name: "Timing", props: [
      {"name":"duration","type":"number","default":"0.35","description":"How long the menu panel takes to open and close, in seconds.\nIt also times the item entrance, the hover highlight glide (60% of it) and the icon morph. With exitFast on, closing uses 60% of it.","label":"Duration"},
      {"name":"delay","type":"number","default":"0.1","description":"Wait before items start staggering in after the panel opens, in seconds.\nThe panel opens straight away; only its items wait.","label":"Delay"},
      {"name":"stagger","type":"number","default":"0.05","description":"Gap between items appearing when the panel opens, and between items leaving (last first) when it closes, in seconds.\nZero makes every item move together and skips the staggered exit.","label":"Stagger"},
    ] },
    { name: "Options", props: [
      {"name":"itemHighlight","type":"\"none\" | \"slide\" | \"fill\"","default":"\"slide\"","description":"Slides one hover highlight between items, fills each item from the top, or disables highlighting.\nThe effect follows the hovered menu item, helping users see which action they are about to choose.","label":"Item highlight"},
      {"name":"selectionIndicator","type":"\"check\" | \"bar\" | \"dot\"","default":"\"check\"","description":"How the chosen radio item is marked.\nChoose a check or another supported marker to distinguish the currently selected radio option.","label":"Selection indicator"},
      {"name":"showDescriptions","type":"boolean","default":"false","description":"Show each item's DropdownMenuItemDescription.\nTurn this on when secondary text should explain each action beneath its title.","label":"Descriptions"},
      {"name":"bold","type":"boolean","default":"false","description":"Bold item titles and the trigger value.\nTurn it on to make menu labels stand out more strongly within the popup.","label":"Bold"},
      {"name":"rollingText","type":"boolean","default":"false","description":"Item titles roll to a copy of themselves when highlighted.\nThe current text moves out while an identical copy moves in, keeping the label readable.","label":"Rolling text"},
    ] },
    { name: "Trigger", props: [
      {"name":"icon","type":"\"chevron\" | \"plus\"","default":"\"plus\"","description":"Chooses the plus or chevron opening indicator.\nThe chosen symbol changes shape as the menu opens and returns when the menu closes.","label":"Icon"},
      {"name":"rollingValue","type":"boolean","default":"true","description":"DropdownMenuValue rolls to the new value when it changes.\nTurn it off to replace the selected label immediately when its value changes.","label":"Rolling value"},
      {"name":"pressFeedback","type":"boolean","default":"false","description":"The trigger and items scale down while pressed and spring back on release.\nReleasing the pointer returns the element to its normal size with a small spring.","label":"Press feedback"},
      {"name":"openOnHover","type":"boolean","default":"false","description":"Whether the menu should also open when the trigger is hovered.\nThe user can reveal content by moving the pointer over the trigger without clicking it.","label":"Open on hover"},
    ] },
    { name: "Behaviour", props: [
      {"name":"closeDelayOnSelect","type":"boolean","default":"false","description":"Show the tick for a moment after a pick before closing.\nThe short pause lets the user see their selection before the menu disappears.","label":"Close delay on select"},
      {"name":"typeahead","type":"boolean","default":"false","description":"Typing a letter jumps to the matching item.\nUsers can move through a long menu by typing part of the option's label.","label":"Type to jump"},
    ] },
  ],
  "form": [
    { name: "Label", props: [
      {"name":"labelStyle","type":"\"floating\" | \"inside\" | \"above\"","default":"\"floating\"","description":"Places input labels above, inside, or floating over the border.\nFloating lifts the label above entered text; above and inside keep the label in their specified positions.","label":"Label"},
    ] },
    { name: "Input", props: [
      {"name":"showSuccessTick","type":"boolean","default":"true","description":"Shows a check when a field is valid.\nThe checkmark gives a visual confirmation that the field's value passed validation. [Ignored when: valid=false, invalid=true]","label":"Show success tick"},
      {"name":"showCounter","type":"boolean","default":"true","description":"Show a character count.\nIt updates as the user types and includes the maximum when maxLength is supplied.","label":"Show counter"},
      {"name":"showDescription","type":"Demo control","default":"false","description":"Shows supporting hints beneath the demo's input fields.\nTurn it off for a more compact form while keeping labels and validation feedback.","label":"Description"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"full\" | \"sm\"","default":"\"lg\"","description":"Corner roundness of the form's inputs, select and buttons.","label":"Roundness"},
    ] },
    { name: "Errors", props: [
      {"name":"validate","type":"Demo control","default":"false","description":"Checks the entered values and shows errors after a field is touched or the form is submitted.\nTurn it off to let every demo submission succeed without those checks.","label":"Check required fields"},
      {"name":"errorAnimation","type":"\"none\" | \"fade\" | \"slide\"","default":"\"slide\"","description":"Slides, fades, or instantly shows field errors.\nChoose a moving reveal, a simple opacity change, or an immediate error display.","label":"Error message entry"},
      {"name":"shakeOnError","type":"boolean","default":"true","description":"Shakes an input when its field becomes invalid.\nThe brief movement draws attention when validation changes from valid to invalid. [Ignored when: invalid=false]","label":"Shake on error"},
    ] },
  ],
  "hover-card": [
    { name: "Content", props: [
      {"name":"site","type":"string","default":"\"vault.hyperiux.com\"","description":"Website whose details the card shows.\nType a site name such as github, a domain, or a full link, and the card loads that site's title, description and image. [Ignored when: source=\"text\"]","label":"Website"},
      {"name":"source","type":"\"link\" | \"text\"","default":"\"link\"","description":"Chooses what the card shows.\nWebsite preview fetches the link's title, description and share image and draws them as a card; manual details shows the content you pass in yourself.","label":"Card shows"},
    ] },
    { name: "Opening", props: [
      {"name":"contentAnimation","type":"\"scale\" | \"fade\"","default":"\"scale\"","description":"Scales or fades the preview into view.\nScale grows the content into place, while fade changes its opacity without resizing it.","label":"Content animation"},
      {"name":"startScale","type":"number","default":"0.9","description":"Starting size of the preview.\nValues below 1 begin smaller and grow to the preview's full size when it opens. [Ignored when: contentAnimation=\"fade\"]","label":"Start scale"},
      {"name":"fadeContent","type":"boolean","default":"true","description":"Content fades in after the card.\nThe container appears first, then its contents become visible with a short fade.","label":"Fade content"},
    ] },
    { name: "Timing", props: [
      {"name":"openDelay","type":"number","default":"0.4","description":"Hover delay before opening, in seconds.\nIncrease it to avoid opening the card when the pointer only passes briefly over the trigger.","label":"Open after"},
      {"name":"closeDelay","type":"number","default":"0.2","description":"Delay before closing, in seconds.\nA short delay gives users time to move between the trigger and its popup without closing it accidentally.","label":"Close after"},
    ] },
    { name: "Link", props: [
      {"name":"followCursor","type":"boolean","default":"false","description":"Card drifts with the pointer.\nAs the pointer moves over the trigger, the preview shifts with it instead of staying completely fixed.","label":"Follow the pointer"},
      {"name":"underline","type":"boolean","default":"true","description":"Link underline draws on hover.\nThe animated line adds emphasis when the user hovers over the trigger or link.","label":"Underline draws in"},
    ] },
    { name: "Style", props: [
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"sm\"","default":"\"lg\"","description":"Corner roundness of the preview card that opens on hover.","label":"Roundness"},
    ] },
  ],
  "input-otp": [
    { name: "Input", props: [
      {"name":"allowedCharacters","type":"\"mixed\" | \"numbers\" | \"letters\" | \"symbols\"","default":"\"mixed\"","description":"Which characters the code accepts.\nCharacters outside the selected set are rejected instead of being added to the code.","label":"Allowed characters"},
    ] },
    { name: "Typing", props: [
      {"name":"glideRing","type":"boolean","default":"true","description":"One ring glides between boxes.\nWhen the active input position changes, the focus ring moves to the next box.","label":"Glide ring"},
      {"name":"charAnimation","type":"\"none\" | \"fade\" | \"roll\" | \"pop\"","default":"\"pop\"","description":"Pops, rolls, or instantly displays each entered character.\nThe effect runs as a character is added or replaced in one of the code boxes.","label":"Character in"},
      {"name":"pasteStagger","type":"number","default":"0.05","description":"Delay between pasted characters appearing, in seconds.\nA small delay makes pasted code fill the boxes one after another rather than all at once. [Ignored when: charAnimation=\"none\"]","label":"Paste stagger"},
    ] },
    { name: "Result", props: [
      {"name":"shakeOnError","type":"boolean","default":"true","description":"Shake when turning invalid.\nThe brief movement draws attention when validation changes from valid to invalid.","label":"Shake on error"},
      {"name":"successWave","type":"boolean","default":"true","description":"Plays the success wave and check animation.\nThe code boxes pulse in sequence and a check confirms successful entry. [Ignored when: success=false]","label":"Green wave when right"},
    ] },
    { name: "Style", props: [
      {"name":"boxSize","type":"\"8\" | \"9\" | \"10\" | \"11\" | \"12\" | \"14\"","default":"\"10\"","description":"Size of each code box, using the named spacing scale.\nLarger sizes make the individual characters and their boxes more prominent.","label":"Box size"},
      {"name":"joined","type":"boolean","default":"false","description":"Boxes share borders as a strip.\nTurn it off to give each character its own separated box with a gap between boxes.","label":"Joined boxes"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"full\" | \"sm\"","default":"\"lg\"","description":"Corner roundness of each code box, or of the whole group's outer corners when joined is on.","label":"Roundness"},
    ] },
  ],
  "menubar": [
    { name: "Panel", props: [
      {"name":"animation","type":"\"scale\" | \"slide\" | \"collapse\" | \"reveal\"","default":"\"collapse\"","description":"Entrance and exit motion when a menu opens or closes.\nThe effect runs when the menu opens or closes, shaping how its panel enters and leaves the screen.","label":"Opening"},
      {"name":"exitFast","type":"boolean","default":"false","description":"Closes in 60% of the opening duration and skips exit staggering.\nUse it when opening should feel deliberate but closing should finish quickly.","label":"Exit fast"},
    ] },
    { name: "Between menus", props: [
      {"name":"switchAnimation","type":"\"glide\" | \"replay\"","default":"\"glide\"","description":"Glides one popup between menus or opens them separately.\nThis determines whether moving between top-level menus feels like one shared panel or separate popups.","label":"Moving over"},
      {"name":"contentAnimation","type":"\"none\" | \"fade\" | \"slide\"","default":"\"slide\"","description":"Slides, fades, or instantly swaps contents during a gliding menu switch.\nThis controls the content inside the popup while the shared panel moves to another trigger. [Ignored when: switchAnimation is not \"glide\"]","label":"Content animation"},
      {"name":"slideDistance","type":"\"md\" | \"lg\" | \"sm\"","default":"\"lg\"","description":"Distance moved by switching content.\nA larger setting makes the incoming and outgoing menu contents travel farther during the switch. [Ignored when: contentAnimation is not \"slide\", switchAnimation is not \"glide\"]","label":"Slide distance"},
    ] },
    { name: "Timing", props: [
      {"name":"duration","type":"number","default":"0.3","description":"How long each dropdown panel takes to open and close, in seconds, and how long the trigger chevron takes to rotate.\nGliding between menus and the trigger highlight pill use their own fixed, faster timing, so this does not change them.","label":"Duration"},
      {"name":"delay","type":"number","default":"0.05","description":"Wait before items start staggering in after a dropdown panel opens, in seconds.\nThe panel opens straight away; only its items wait.","label":"Delay"},
      {"name":"stagger","type":"number","default":"0.03","description":"Gap between items appearing in an opened dropdown panel, in seconds.\nA larger gap makes the items build more slowly; zero shows them all together.","label":"Stagger"},
    ] },
    { name: "Bar", props: [
      {"name":"triggerHighlight","type":"\"none\" | \"pill\" | \"underline\"","default":"\"pill\"","description":"Highlights the active trigger with a pill, line, or no marker.\nThe marker identifies the top-level menu currently being hovered or opened.","label":"Menu highlight"},
      {"name":"triggerHighlightColor","type":"\"muted\" | \"primary\"","default":"\"primary\"","description":"Color of the active trigger marker.\nChoose a stronger primary marker or a quieter muted treatment. [Ignored when: triggerHighlight=\"none\"]","label":"Highlight fill"},
      {"name":"showChevrons","type":"boolean","default":"false","description":"Shows a chevron beside each trigger unless overridden on that trigger.\nThe arrows indicate that the top-level labels open menus with more options.","label":"Chevrons"},
      {"name":"triggerRollingText","type":"boolean","default":"true","description":"Rolls trigger labels on hover.\nA duplicate label slides into place as the original label moves away.","label":"Rolling trigger text"},
      {"name":"openOnClick","type":"boolean","default":"false","description":"Requires a click to open a menu.\nOff by default, so hovering a trigger opens its menu and moving along the bar switches between menus.","label":"Open on click"},
      {"name":"pressFeedback","type":"boolean","default":"true","description":"Scales triggers and items down while pressed.\nReleasing the pointer returns the element to its normal size with a small spring.","label":"Press feedback"},
    ] },
    { name: "Items", props: [
      {"name":"itemHighlight","type":"\"none\" | \"slide\" | \"fill\"","default":"\"slide\"","description":"Slides a highlight, fills each item, or disables the item highlight.\nThe highlight follows the item being targeted inside the open menu.","label":"Item highlight"},
      {"name":"itemHighlightColor","type":"\"muted\" | \"primary\"","default":"\"primary\"","description":"Color of the item highlight.\nUse primary for a stronger item emphasis or muted for a softer hover state. [Ignored when: itemHighlight=\"none\"]","label":"Item highlight color"},
      {"name":"selectionIndicator","type":"\"check\" | \"bar\" | \"dot\"","default":"\"check\"","description":"Chooses how the selected radio menu item is marked.\nThis affects selection markers inside menus rather than the top-level trigger highlight.","label":"Selection indicator"},
      {"name":"showIcons","type":"boolean","default":"true","description":"Shows icons supplied to menu items.\nTurn it off to give the menus a simpler text-only appearance.","label":"Icons"},
      {"name":"showDescriptions","type":"boolean","default":"true","description":"Shows the description supplied for each menu item.\nTurn this on when secondary text should explain each action beneath its title.","label":"Descriptions"},
      {"name":"rollingText","type":"boolean","default":"false","description":"Rolls the label to a copy of itself on hover.\nThe current text moves out while an identical copy moves in, keeping the label readable.","label":"Rolling text"},
    ] },
    { name: "Style", props: [
      {"name":"size","type":"\"md\" | \"lg\" | \"sm\"","default":"\"lg\"","description":"Sets the size of the control.\nChanging it adjusts the control's dimensions and spacing while keeping the same behavior.","label":"Size"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"sm\"","default":"\"lg\"","description":"Corner roundness of the bar, its trigger highlight, the dropdown panels and the items inside them.","label":"Roundness"},
    ] },
  ],
  "questionnaire": [
    { name: "Content", props: [
      {"name":"contentAnimation","type":"\"none\" | \"scale\" | \"fade\" | \"slide-x\" | \"slide-y\"","default":"\"slide-y\"","description":"Chooses horizontal slide, vertical slide, scale, fade, or no question transition.\nMoving to the next or previous question plays this transition between the two question panels.","label":"Content animation"},
      {"name":"slideDistance","type":"number","default":"20","description":"Question travel distance in viewport-width units.\nIncrease it to make the incoming and outgoing content travel farther during a switch. [Ignored when: contentAnimation=\"scale\", content=\"fade\", content=\"none\"]","label":"Slide distance"},
    ] },
    { name: "Choices", props: [
      {"name":"choiceLayout","type":"\"inline\" | \"card\"","default":"\"card\"","description":"Lays choices out as cards or inline rows.\nCards give each answer a larger separate area; inline uses more compact rows.","label":"Layout"},
      {"name":"choiceHover","type":"\"fade\" | \"top\"","default":"\"top\"","description":"Slides or fades the hover highlight across choices.\nThe effect helps show which answer will be selected before the user clicks it.","label":"Choice hover"},
      {"name":"choiceColor","type":"\"muted\" | \"primary\"","default":"\"primary\"","description":"Color used for selected choices.\nPrimary gives selected answers more contrast, while muted uses a softer background.","label":"Selected color"},
      {"name":"indicatorRounded","type":"\"none\" | \"md\" | \"lg\" | \"full\" | \"sm\"","default":"\"full\"","description":"Roundness of check indicators.\nChoose squared or rounded corners to match the rest of your answer controls. [Ignored when: choiceIndicator=\"radio\", choiceIndicator=\"none\"]","label":"Icon roundness"},
      {"name":"indicatorBorder","type":"boolean","default":"false","description":"Boxes the check indicator.\nTurning it off leaves the checkmark visible without a surrounding box. [Ignored when: choiceIndicator=\"radio\", choiceIndicator=\"none\"]","label":"Icon border"},
      {"name":"choiceIndicator","type":"\"none\" | \"radio\" | \"check\"","default":"\"check\"","description":"Marks selected choices with a check, radio dot, or no indicator.\nThe indicator changes when the user selects or clears an answer.","label":"Indicator"},
      {"name":"multiple","type":"boolean","default":"false","description":"Lets a question take more than one answer.\nUsers can select several answers for a question instead of replacing their previous choice.","label":"Choose multiple"},
      {"name":"staggerChoices","type":"boolean","default":"true","description":"Choices rise in one after another.\nThe choices become visible in order instead of appearing as one block.","label":"Stagger choices"},
      {"name":"stagger","type":"number","default":"0.05","description":"Gap between choices appearing after a question enters, in seconds.\nA larger gap makes the choices build more slowly; zero shows them together. [Ignored when: staggerChoices=false]","label":"Stagger"},
    ] },
    { name: "Border", props: [
      {"name":"bordered","type":"Demo control","default":"true","description":"Shows a border around the questionnaire demo area.\nTurn it off to hide the outline while keeping the same layout and spacing.","label":"Show border"},
    ] },
    { name: "Progress", props: [
      {"name":"showProgress","type":"boolean","default":"true","description":"Shows the question count and bar.\nTurn it off when the surrounding page already provides its own progress indicator.","label":"Show progress"},
      {"name":"shortcuts","type":"\"numbers\" | \"letters\"","default":"\"off\"","description":"Uses letters or numbers as keyboard shortcuts for choices.\nUsers can pick an answer by pressing its displayed letter or number.","label":"Choice keys"},
    ] },
    { name: "Motion", props: [
      {"name":"duration","type":"number","default":"0.4","description":"How long a question takes to move in and out when you go to the next or previous one, in seconds.\nIt also times the choice hover transition. The Previous and Next button hover fill has its own fixed timing.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0.1","description":"Spring overshoot of the question moving in, 0–1.\nIt has no effect when contentAnimation is fade or none, since those do not use a spring.","label":"Bounce"},
    ] },
  ],
  "radio": [
    { name: "Style", props: [
      {"name":"variant","type":"\"default\" | \"card\"","default":"\"default\"","description":"Chooses the visual style.\nCard gives the entire option a highlighted container, while default keeps the control and label compact.","label":"Style"},
      {"name":"cardFillColor","type":"\"muted\" | \"primary\"","default":"\"muted\"","description":"Color of a selected card.\nThe selected card uses either a quieter muted background or the stronger primary color. [Ignored when: variant=\"default\"]","label":"Card fill color"},
      {"name":"showIcon","type":"boolean","default":"true","description":"Shows the selection control beside the label.\nTurning it off removes the optional icon while leaving the text and interaction available.","label":"Icon"},
    ] },
    { name: "Choosing", props: [
      {"name":"slideDot","type":"boolean","default":"false","description":"Slides one selection dot between options.\nThe selected dot travels from the previous option to the new one instead of appearing in place. [Ignored when: appearance=\"full\", showIcon=false]","label":"Slide dot"},
      {"name":"slideCard","type":"boolean","default":"true","description":"Slides the selected card background between options.\nOne background moves between selected cards, visually connecting the old and new choices. [Ignored when: variant=\"default\"]","label":"Slide card"},
      {"name":"elastic","type":"boolean","default":"true","description":"Bounces the radio control when selected or pressed.\nThe selected radio control compresses and springs back to emphasize the newly chosen option. [Ignored when: showIcon=false]","label":"Elastic"},
    ] },
    { name: "Radio", props: [
      {"name":"appearance","type":"\"filled\" | \"outline\" | \"full\"","default":"\"outline\"","description":"Chooses an outlined, filled, or solid radio control.\nThis changes the selected control's visual treatment while keeping its selection behavior. [Ignored when: showIcon=false]","label":"Look"},
    ] },
    { name: "Group", props: [
      {"name":"reorder","type":"boolean","default":"false","description":"Allows items to be dragged into a new order.\nUsers can move an item by dragging it, and neighboring items shift to make room.","label":"Drag to reorder"},
      {"name":"colorful","type":"Demo control","default":"false","description":"Gives each option its own accent color when selected.\nTurn it off to use the shared theme color for every option.","label":"Colour per option"},
    ] },
  ],
  "skeleton": [
    { name: "Skeleton appearance", props: [
      {"name":"animation","type":"\"none\" | \"shimmer\" | \"pulse\" | \"wave\"","default":"\"shimmer\"","description":"Default animation for placeholders in this group; individual Skeleton props can override it.\nUse one group setting to keep multiple placeholder shapes visually consistent.","label":"Animation"},
      {"name":"duration","type":"number","default":"1.6","description":"Default animation cycle length, in seconds.\nIncrease it to slow the transition down, or reduce it for a quicker response. [Ignored when: animation=\"none\"]","label":"Duration"},
      {"name":"stagger","type":"number","default":"0.12","description":"Time offset between indexed placeholders.\nA larger gap makes the sequence more noticeable; zero makes the items start together. [Ignored when: animation=\"none\"]","label":"Stagger"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"full\" | \"sm\"","default":"\"md\"","description":"Corner roundness of each placeholder shape.\nThe loaded content is not changed.","label":"Roundness"},
    ] },
    { name: "Content transition", props: [
      {"name":"swapAnimation","type":"\"none\" | \"scale\" | \"fade\" | \"rise\"","default":"\"scale\"","description":"Chooses how loaded content replaces the placeholders.\nThe loaded content can fade, rise, scale into place, or replace the placeholders immediately.","label":"Swap animation"},
      {"name":"swapDuration","type":"Demo control","default":"0.4","description":"Sets how long loaded content takes to replace the placeholders, in seconds.\nIncrease it for a slower reveal or reduce it for a quicker handoff. [Ignored when: swapAnimation=\"none\"]","label":"Content entrance duration"},
      {"name":"swapStagger","type":"Demo control","default":"0.06","description":"Delays successive pieces of loaded content as they appear, in seconds.\nZero reveals the pieces together; a larger gap makes the sequence more noticeable. [Ignored when: swapAnimation=\"none\"]","label":"Delay between content items"},
    ] },
    { name: "Loading preview", props: [
      {"name":"loadTime","type":"Demo control","default":"3","description":"Sets the simulated loading time used when restarting the demo, in seconds.\nThe placeholders remain visible until this timer finishes and reveals the content.","label":"Skeleton loading time"},
    ] },
  ],
  "slider": [
    { name: "Track", props: [
      {"name":"smooth","type":"boolean","default":"false","description":"Slides freely instead of snapping to each step.\nThe handle and fill follow the pointer smoothly and the value is only rounded to one decimal place. Keyboard arrows then move by 0.1.","label":"Smooth (no snapping)"},
      {"name":"duration","type":"number","default":"0.4","description":"Spring settle time, in seconds, for the fill and thumb following the value.\nIt also times the rail thickening and shrinking on hover or drag.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0","description":"Spring overshoot of the fill and thumb, and of the rail thickening and shrinking, 0–1.\nZero removes the bounce.","label":"Bounce"},
      {"name":"thickenOn","type":"\"none\" | \"drag\" | \"hover\"","default":"\"hover\"","description":"Thickens the track on hover or drag, or keeps it fixed; vertical sliders thickenOn on drag.\nThe track expands while the user interacts, then returns to its resting thickness.","label":"Thicken on"},
      {"name":"elastic","type":"boolean","default":"true","description":"Lets the horizontal track stretch beyond its endpoints.\nThe extra movement gives the slider a soft boundary rather than a rigid stop. [Ignored when: orientation=\"vertical\"]","label":"Elastic"},
      {"name":"stretchAmount","type":"number","default":"10","description":"Maximum overshoot as a percentage of track width.\nA larger value allows a more visible stretch before the element returns to its resting shape. [Ignored when: elastic=false, orientation=\"vertical\"]","label":"Stretch amount"},
      {"name":"labels","type":"\"none\" | \"rail\"","default":"\"rail\"","description":"Shows endpoint/value labels on the rail, or hides them.\nThese labels make the range and current selection readable without relying only on thumb position. [Ignored when: orientation=\"vertical\"]","label":"Values on rail"},
      {"name":"thickenedSize","type":"\"0.5\" | \"1\" | \"1.5\" | \"2.5\" | \"4\" | \"13\"","default":"\"13\"","description":"Track thickness while expanded.\nChoose a larger setting when the track should expand more noticeably during interaction. [Ignored when: thickenOn=\"none\"]","label":"Thickened size"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"full\" | \"sm\"","default":"\"xl\"","description":"Corner roundness of the slider rail, its fill and the thumb.","label":"Roundness"},
      {"name":"marks","type":"\"none\" | \"dots\" | \"lines\"","default":"\"none\"","description":"Shows step marks on the track, or hides them.\nUse dots or lines when users need visible reference points along the range.","label":"Step marks"},
    ] },
    { name: "Edge", props: [
      {"name":"showEdge","type":"boolean","default":"true","description":"Shows the visible thumb; hiding it keeps the slider interactive.\nThis only changes the thumb's appearance; users can still adjust the value through the slider.","label":"Show edge"},
      {"name":"edgePress","type":"\"none\" | \"shrink\" | \"grow\"","default":"\"shrink\"","description":"Scales the thumb while pressed.\nChoose grow or shrink for press feedback, or none to keep the thumb size unchanged. [Ignored when: showEdge=false]","label":"While dragging"},
      {"name":"edgeVariant","type":"\"filled\" | \"outline\" | \"bar\"","default":"\"bar\"","description":"Chooses a bar or circular thumb style.\nUse the thumb shape to make the current position look like a line, solid dot, or outlined circle. [Ignored when: showEdge=false]","label":"Style"},
      {"name":"bubble","type":"\"none\" | \"hover\" | \"dragging\" | \"always\"","default":"\"hover\"","description":"Shows the value bubble on hover, drag, always, or never.\nThe floating value label can appear only during interaction or remain visible all the time.","label":"Value bubble"},
      {"name":"rollingNumbers","type":"boolean","default":"true","description":"Rolls numeric labels when their value changes.\nTurn it off to replace value text instantly instead of animating changing digits.","label":"Rolling numbers"},
    ] },
    { name: "Style", props: [
      {"name":"edgeSize","type":"\"md\" | \"lg\" | \"sm\"","default":"\"md\"","description":"Size of circular thumb styles.\nLarger thumb sizes make the current value's handle more visually prominent. [Ignored when: edgeVariant=\"bar\", showEdge=false]","label":"Edge size"},
    ] },
  ],
  "switch": [
    { name: "Style", props: [
      {"name":"variant","type":"\"elastic\" | \"apple\"","default":"\"elastic\"","description":"Chooses elastic press motion or an Apple-style draggable handle.\nElastic deforms on press; apple also allows the handle to be dragged between on and off.","label":"Switch type"},
      {"name":"size","type":"\"md\" | \"lg\" | \"xl\"","default":"\"xl\"","description":"Sets the size of the control.\nChanging it adjusts the control's dimensions and spacing while keeping the same behavior.","label":"Size"},
      {"name":"color","type":"\"foreground\" | \"green\" | \"blue\" | \"orange\" | \"rose\"","default":"\"foreground\"","description":"Track colour when on.\nForeground follows the theme foreground color; the others use the theme success, info, warning and destructive colors.","label":"On colour"},
      {"name":"appleGreen","type":"boolean","default":"false","description":"Uses iOS green instead of the foreground track color.\nThis produces the familiar green on-state when using the Apple-style switch. [Ignored when: variant is not \"apple\", color is not \"foreground\"]","label":"Apple green"},
      {"name":"rounded","type":"\"md\" | \"lg\" | \"xl\" | \"full\" | \"sm\"","default":"\"full\"","description":"Corner roundness of the switch track and its handle.","label":"Roundness"},
      {"name":"showMarks","type":"boolean","default":"false","description":"Small I / O marks in the track.\nThe I and O symbols help identify the on and off sides without relying only on color.","label":"Show marks"},
      {"name":"labelPosition","type":"\"left\" | \"right\" | \"top\" | \"bottom\"","default":"\"top\"","description":"Places the label above, below, left, or right.\nUse the placement that best fits the surrounding form or settings layout. [Ignored when: label is missing]","label":"Label position"},
    ] },
    { name: "Motion", props: [
      {"name":"pressSqueeze","type":"number","default":"0.18","description":"How hard the handle squashes (elastic) or widens (apple) when pressed.\nHigher values make the handle deformation more visible while the user presses it.","label":"Press squeeze"},
      {"name":"duration","type":"number","default":"0.35","description":"Travel time of the handle, in seconds.\nIncrease it to slow the transition down, or reduce it for a quicker response.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0.3","description":"Amount of spring overshoot; 0 removes the bounce.\nHigher values move past the final position before settling; zero gives a firmer stop.","label":"Bounce"},
    ] },
  ],
  "table": [
    { name: "Entrance", props: [
      {"name":"staggerRows","type":"boolean","default":"true","description":"Rows fade and rise in one after another when the table scrolls into view.\nThe sequence starts as the table enters the viewport instead of showing every row at once.","label":"Stagger rows"},
      {"name":"staggerCells","type":"boolean","default":"false","description":"Staggers cells from left to right during entry.\nCombined with row staggering, this creates a diagonal wave through the table's cells. [Ignored when: staggerRows=false]","label":"Stagger cells"},
      {"name":"numberAnimation","type":"\"off\" | \"on\" | \"roll\"","default":"\"roll\"","description":"Rolls digits, counts numbers smoothly, or shows values without animation.\nChoose off when numbers should change immediately with no counting or rolling effect.","label":"Number animation"},
    ] },
    { name: "Timing", props: [
      {"name":"duration","type":"number","default":"0.4","description":"Base length of the table's motion, in seconds.\nIt times each row's entrance, the row highlight glide and the page swap; count-up and rolling numbers run about 2.5 times longer.","label":"Duration"},
      {"name":"stagger","type":"number","default":"0.04","description":"Gap between rows appearing when the table loads or the page changes, in seconds.\nA larger gap makes the rows arrive more slowly; zero shows them together.","label":"Stagger"},
    ] },
    { name: "Hover", props: [
      {"name":"rowHighlight","type":"\"none\" | \"slide\" | \"fill\"","default":"\"slide\"","description":"How the hovered row is highlighted.\nThe effect follows the hovered menu item, helping users see which action they are about to choose.","label":"Row highlight"},
      {"name":"rowHighlightColor","type":"\"muted\" | \"primary\"","default":"\"muted\"","description":"Color of the hovered row.\nUse primary for stronger contrast or muted for a softer row highlight. [Ignored when: rowHighlight=\"none\"]","label":"Row highlight color"},
      {"name":"rollingText","type":"boolean","default":"false","description":"Text cells roll to a copy of themselves on hover (not numbers or status badges).\nThe current text moves out while an identical copy moves in, keeping the label readable.","label":"Rolling text"},
    ] },
    { name: "Data", props: [
      {"name":"showStatusFilter","type":"boolean","default":"true","description":"Shows status filter chips.\nClicking a chip narrows the displayed rows to those matching that status. [Ignored when: statusKey is missing, statuses is empty]","label":"Show status filter"},
      {"name":"highlightTotal","type":"boolean","default":"false","description":"Shows the total footer with a muted fill.\nThe footer gives users a summary of the numeric field selected by totalKey. [Ignored when: totalKey is missing]","label":"Highlight total"},
      {"name":"showPagination","type":"boolean","default":"false","description":"Split rows into pages that slide.\nUsers can move between pages instead of scrolling through every row at once.","label":"Show pagination"},
    ] },
    { name: "Selection", props: [
      {"name":"selectable","type":"boolean","default":"false","description":"Row checkboxes, with shift-click ranges.\nUsers can select individual rows or use Shift-click to select a continuous range.","label":"Row checkboxes"},
      {"name":"showSelectAll","type":"boolean","default":"true","description":"Shows the header selection checkbox.\nThe checkbox selects the table's current visible rows together instead of requiring individual clicks. [Ignored when: selectable=false]","label":"Show select all"},
      {"name":"selectMark","type":"\"circle\" | \"check\"","default":"\"check\"","description":"Chooses a check or filled-circle selection mark.\nThis changes the appearance of row selection without changing which rows are selected. [Ignored when: selectable=false]","label":"Select mark"},
      {"name":"showActionBar","type":"boolean","default":"true","description":"Shows bulk actions for selected rows.\nThe bar appears when rows are selected and provides actions that apply to that selection. [Ignored when: selectable=false, no rows are selected]","label":"Show action bar"},
    ] },
    { name: "Rows", props: [
      {"name":"dragMode","type":"\"none\" | \"rows\"","default":"false","description":"What can be dragged to reorder.\nChoose rows to let users rearrange rows with the drag handle, or none to disable reordering.","label":"Drag mode"},
      {"name":"showStatusBadges","type":"boolean","default":"true","description":"Status as coloured pills that change on click.\nClicking a badge moves the row to the next configured status.","label":"Show status badges"},
      {"name":"expandable","type":"boolean","default":"false","description":"Click a row to open its detail panel.\nThe extra panel opens beneath the row and displays the content returned by renderDetail.","label":"Expandable preview"},
      {"name":"removable","type":"boolean","default":"false","description":"A delete button on each row.\nClicking the row's delete action removes it from the table's internal dataset.","label":"Delete column"},
      {"name":"addable","type":"boolean","default":"true","description":"An Add button above the table.\nClicking Add inserts a new row, using createRow when you provide it.","label":"Add rows"},
    ] },
    { name: "Layout", props: [
      {"name":"textAlign","type":"\"center\" | \"left\" | \"right\"","default":"\"left\"","description":"Text alignment for every heading, cell and the footer.\nChoose left, center, or right to keep the table's labels and values consistently aligned.","label":"Text alignment"},
      {"name":"bordered","type":"boolean","default":"true","description":"A rounded border around the whole table.\nUse it to separate the component from the surrounding page with a visible outer boundary.","label":"Border"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"sm\"","default":"\"lg\"","description":"Roundness of the table corners; row highlights clip at these outer edges.\nSmall values keep the outline more square; larger values make the corners softer.","label":"Roundness"},
      {"name":"showHorizontalLines","type":"boolean","default":"true","description":"Draws horizontal separators between neighboring table rows.\nThese separators help users follow a row across its cells.","label":"Show horizontal lines"},
      {"name":"showVerticalLines","type":"boolean","default":"true","description":"Lines between columns.\nThese separators make the boundaries between neighboring columns easier to see.","label":"Show vertical lines"},
      {"name":"showHeaderBorder","type":"boolean","default":"true","description":"The line under the header row.\nTurn it on to visually separate column headings from the first row of data.","label":"Show header border"},
      {"name":"boldHeader","type":"boolean","default":"true","description":"Semibold header text; off, it's regular weight.\nTurn it off when headings should use the same regular weight as the table text.","label":"Bold header"},
      {"name":"stickyHeader","type":"boolean","default":"true","description":"Pin the header while the table scrolls.\nColumn headings remain visible at the top while the rows scroll underneath them.","label":"Sticky header"},
      {"name":"expandFullTable","type":"boolean","default":"false","description":"Show every row without the internal height limit.\nThe table grows with its rows instead of placing them in an internally scrolling area.","label":"Expand full table"},
      {"name":"height","type":"string | number | string & {}","default":"50","description":"Maximum table height, as a CSS length or pixels.\nRows beyond this height are available by scrolling inside the table. [Ignored when: expandFullTable=true]","label":"Table height"},
      {"name":"stickyFooter","type":"boolean","default":"true","description":"Pins the total footer while scrolling.\nThe total stays visible at the bottom as the user scrolls through rows. [Ignored when: highlightTotal=false, totalKey is missing]","label":"Sticky last row"},
      {"name":"loadingSkeleton","type":"boolean","default":"true","description":"Shows placeholder rows during loading.\nPlaceholder rows occupy the table while data loads, then give way to the actual rows. [Ignored when: loading=false]","label":"Loading skeleton"},
    ] },
  ],
  "tabs": [
    { name: "Tabs", props: [
      {"name":"activeIndicator","type":"\"fade\" | \"underline\" | \"glide\"","default":"\"glide\"","description":"Uses a sliding pill, sliding underline, or fading underline.\nGlide moves a filled pill, underline slides a line, and fade changes the underline's opacity in place.","label":"Active indicator"},
      {"name":"activeColor","type":"\"muted\" | \"primary\"","default":"\"primary\"","description":"Color of the active pill.\nPrimary gives the selected tab a stronger fill, while muted uses a softer background. [Ignored when: activeIndicator=\"underline\", indicator=\"fade\"]","label":"Active tab colour"},
      {"name":"hoverHighlight","type":"boolean","default":"false","description":"A soft highlight follows the pointer over the tabs.\nMoving between inactive tabs slides the highlight along the tab list.","label":"Hover highlight"},
      {"name":"divider","type":"boolean","default":"true","description":"A line under the row of tabs, between the tabs and the content.\nIt visually separates the navigation controls from the content displayed below them.","label":"Line under tabs"},
      {"name":"listBorder","type":"boolean","default":"false","description":"A box border around the row of tabs.\nUse it to give the tab controls their own visible container.","label":"Border on tabs"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"full\" | \"sm\"","default":"\"lg\"","description":"Corner roundness of the tab list, the active tab indicator and the content panel border.","label":"Roundness"},
    ] },
    { name: "Content", props: [
      {"name":"panelBorder","type":"boolean","default":"false","description":"Border around the content panel.\nUse it when the active panel needs a clear boundary against the surrounding page.","label":"Border on content"},
      {"name":"contentAnimation","type":"\"none\" | \"fade\" | \"slide\"","default":"\"slide\"","description":"Slides, fades, or instantly switches between panels.\nIt runs when the selected tab changes, revealing the next panel with the chosen transition.","label":"Content animation"},
      {"name":"slideDistance","type":"number","default":"40","description":"Panel slide distance in pixels.\nIncrease it to make the incoming and outgoing content travel farther during a switch. [Ignored when: contentAnimation=\"fade\", content=\"none\"]","label":"Slide distance"},
      {"name":"smoothHeight","type":"boolean","default":"true","description":"The panel grows and shrinks to fit the content instead of jumping.\nClicking a tab with taller or shorter content smoothly changes the panel height to fit.","label":"Smooth panel height"},
      {"name":"fadeDuration","type":"number","default":"0.35","description":"Duration of each panel fade, in seconds.\nA longer value makes each fade slower, so replacing one panel with another takes longer. [Ignored when: contentAnimation=\"slide\", content=\"none\"]","label":"Fade duration"},
    ] },
    { name: "Motion", props: [
      {"name":"duration","type":"number","default":"0.35","description":"How long the active tab indicator and the panel content take to move when the selected tab changes, in seconds.\nThe outgoing panel leaves in half of this time; the panel fade uses fadeDuration.","label":"Duration"},
      {"name":"bounce","type":"number","default":"0.15","description":"Spring overshoot of the tab indicator and the sliding panel, 0–1.\nZero gives a firm stop; higher values overshoot before settling.","label":"Bounce"},
    ] },
  ],
  "theme-switch": [
    { name: "Transition", props: [
      {"name":"revealAnimation","type":"\"circle\" | \"fade\" | \"swipe\"","default":"\"circle\"","description":"Reveals the new theme with a circle, swipe, or fade; switches instantly if View Transitions are unavailable.\nThe reveal plays across the page when the user clicks the button to change the theme.","label":"Reveal animation"},
      {"name":"duration","type":"number","default":"0.7","description":"Animation duration in seconds.\nIncrease it to slow the transition down, or reduce it for a quicker response.","label":"Duration"},
    ] },
    { name: "Button", props: [
      {"name":"iconAnimation","type":"\"spin\" | \"orbit\"","default":"\"spin\"","description":"Spins the sun/moon icons or orbits them around each other.\nSpin swaps the icons with rotation; orbit moves the sun and moon around each other.","label":"Icon motion"},
      {"name":"showTooltip","type":"boolean","default":"true","description":"A label above the button while hovered or focused.\nProvide a short label so users can identify an item when its visible text is hidden.","label":"Tooltip"},
      {"name":"variant","type":"null | \"link\" | \"outline\" | \"default\" | \"secondary\" | \"ghost\" | \"destructive\"","default":"\"outline\"","description":"Chooses the visual style.\nUse it to choose how strongly the control stands out through its background, border, and text color.","label":"Look"},
    ] },
  ],
  "toast": [
    { name: "Toast", props: [
      {"name":"variant","type":"Demo control","default":"\"default\"","description":"Chooses the kind of toast created by the demo button.\nThe message and status feedback change to match the selected kind.","label":"Variant"},
      {"name":"showDescription","type":"Demo control","default":"true","description":"Includes supporting text beneath the toast's main message.\nTurn it off to show only the title and any enabled action.","label":"Description"},
      {"name":"collapsibleDescription","type":"boolean","default":"true","description":"Lets the description expand and collapse.\nUsers can open the longer message when they need more detail and collapse it afterward. [Ignored when: toast description is missing]","label":"Collapsible description"},
      {"name":"showAction","type":"Demo control","default":"false","description":"Adds an action button to the demo toast so users can respond from the notification.\nTurn it off to show the message without that extra button.","label":"Show action"},
    ] },
    { name: "Behaviour", props: [
      {"name":"timeout","type":"number","default":"5","description":"Sets the demo toast's automatic dismissal delay, in seconds.\nSet it to zero to leave the toast open until it is dismissed manually.","label":"Stays for"},
    ] },
    { name: "Animation", props: [
      {"name":"elastic","type":"boolean","default":"true","description":"Uses a spring-like entrance and stack movement.\nTurning it off uses smooth easing without the spring-like settling motion.","label":"Elastic"},
      {"name":"originFromTrigger","type":"boolean","default":"false","description":"Grows the toast from its supplied data.origin.\nThis visually connects the floating content to the place it was opened from. [Ignored when: data.origin is missing]","label":"Origin from trigger"},
      {"name":"fadeContent","type":"boolean","default":"true","description":"Fades the toast text in after its container appears.\nThe container appears first, then its contents become visible with a short fade.","label":"Fade content"},
      {"name":"exitAnimation","type":"\"fade\" | \"slide\"","default":"\"fade\"","description":"Fades or slides dismissed toasts; swiping uses its own exit motion.\nChoose a subtle opacity change or movement toward the edge of the screen when a toast closes.","label":"Exit animation"},
      {"name":"tiltOnSwipe","type":"boolean","default":"true","description":"Tilts a toast as it is swiped away.\nThe panel rotates slightly during a swipe instead of moving in a perfectly straight line.","label":"Tilt on swipe"},
      {"name":"morphIcon","type":"boolean","default":"true","description":"Animates transitions between loading, success, and error icons.\nThe status symbol changes with animation instead of being replaced abruptly.","label":"Loading → tick morph"},
      {"name":"showTimerBar","type":"boolean","default":"true","description":"Shows remaining time before dismissal.\nThe bar shrinks as time passes, giving a visual cue that the toast will close soon. [Ignored when: timeout=0, toast type=\"loading\"]","label":"Show timer bar"},
    ] },
    { name: "Style", props: [
      {"name":"glass","type":"boolean","default":"true","description":"See-through, blurred background.\nContent behind the toast remains faintly visible through its blurred surface.","label":"Glass"},
      {"name":"showAccentEdge","type":"boolean","default":"true","description":"Adds a colored edge for recognized toast types.\nThe edge color helps distinguish feedback such as success, warning, and error messages. [Ignored when: toast type is missing]","label":"Show accent edge"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"3xl\" | \"full\"","default":"\"md\"","description":"Corner roundness of each toast card.","label":"Roundness"},
      {"name":"position","type":"\"bottom-right\" | \"bottom-left\" | \"bottom-center\" | \"top-right\" | \"top-left\" | \"top-center\"","default":"\"bottom-center\"","description":"Sets the screen edge and alignment of the toast stack.\nChanging it moves the whole stack, including new toasts that appear afterward.","label":"Position"},
    ] },
  ],
  "tooltip": [
    { name: "Look", props: [
      {"name":"variant","type":"\"outline\" | \"default\"","default":"\"default\"","description":"Chooses the tooltip's surface style.\nChoose the background and text treatment that fits the surrounding interface.","label":"Style"},
      {"name":"rounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"full\" | \"sm\"","default":"\"md\"","description":"Corner roundness of the tooltip box.","label":"Roundness"},
    ] },
    { name: "Position", props: [
      {"name":"follow","type":"\"cursor\" | \"anchor\"","default":"\"cursor\"","description":"Anchors the tooltip to the pointer or the trigger element.\nCursor follows pointer movement, while element keeps the tooltip attached to its trigger.","label":"Position"},
      {"name":"side","type":"\"left\" | \"right\" | \"top\" | \"bottom\"","default":"\"top\"","description":"Which side of the cursor or element the tooltip sits on.\nThe tooltip is placed on that side of whichever anchor is selected by follow.","label":"Side"},
      {"name":"sideOffset","type":"\"8\" | \"1\" | \"4\" | \"2\" | \"3\" | \"6\"","default":"\"4\"","description":"Gap between the tooltip and its anchor, using the named spacing scale.\nIncrease it when the floating label should sit farther away from the pointer or element.","label":"Side offset"},
    ] },
    { name: "Moving between", props: [
      {"name":"changeAnimation","type":"\"fade\" | \"slide\" | \"roll\" | \"instant\"","default":"\"slide\"","description":"Chooses how content changes when moving between triggers.\nThis runs when the shared tooltip switches from one trigger's text to another's.","label":"Change animation"},
      {"name":"duration","type":"number","default":"0.35","description":"Seconds the box takes to reshape when the text changes.\nIncrease it to slow the transition down, or reduce it for a quicker response.","label":"Duration"},
    ] },
    { name: "Feel", props: [
      {"name":"elastic","type":"boolean","default":"true","description":"The rubbery feel of the tooltip box as it follows the cursor or glides to another trigger.\nOff, it settles with no overshoot; on, it can overshoot and use stretch or tilt. It only changes how the box moves, and unlike bounce it never affects the box resizing to fit new text.","label":"Elastic"},
      {"name":"bounce","type":"number","default":"0.2","description":"How much the box overshoots, both while following (needs elastic on) and when it resizes to fit new text in the morph change mode.\nHigher values move past the final position before settling; zero gives a firmer stop. Elastic switches the follow overshoot on or off, while bounce sets its amount. [Ignored when: elastic=false and changeAnimation is not \"morph\"]","label":"Bounce"},
      {"name":"stretchOnMove","type":"boolean","default":"true","description":"Stretches the tooltip with pointer speed.\nThe box briefly widens in the direction it moves, then returns to its normal shape. [Ignored when: elastic=false]","label":"Stretch on move"},
      {"name":"tiltOnMove","type":"boolean","default":"true","description":"Leans the tooltip with pointer speed.\nThe tooltip leans with movement, then settles upright as the pointer slows down. [Ignored when: elastic=false]","label":"Tilt on move"},
      {"name":"stiffness","type":"number","default":"750","description":"How tightly it follows.\nLower values follow more softly, while higher values catch up to the target more quickly.","label":"Follow speed"},
    ] },
    { name: "Show and hide", props: [
      {"name":"appearAnimation","type":"\"none\" | \"scale\" | \"fade\"","default":"\"scale\"","description":"Chooses how the tooltip first appears.\nChoose the entrance effect users see when the tooltip becomes visible for the first time.","label":"Appear animation"},
      {"name":"closeDelay","type":"number","default":"0.1","description":"Seconds before it closes, so it can stay open while you cross a gap to the next trigger.\nA short delay gives users time to move between the trigger and its popup without closing it accidentally.","label":"Close delay"},
    ] },
  ],
  "sidebar": [
    { name: "Sidebar", props: [
      {"name":"resizable","type":"boolean","default":"false","description":"Lets SidebarRail drag to resize the desktop panel.\nDragging the sidebar rail changes the panel width while keeping the page layout in sync. [Ignored on: mobile, missing SidebarRail]","label":"Drag edge to resize"},
    ] },
    { name: "Active item", props: [
      {"name":"highlightColor","type":"\"muted\" | \"primary\"","default":"\"primary\"","description":"Uses primary or muted colors for menu highlights.\nMuted gives a quieter selection, while primary makes the active item stand out more strongly.","label":"Highlight color"},
      {"name":"itemRounded","type":"\"none\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"full\" | \"sm\"","default":"\"none\"","description":"Sets corner roundness for menu items.\nThis controls the shape of navigation items without changing the sidebar's outer corners.","label":"Item roundness"},
      {"name":"slideHighlight","type":"boolean","default":"true","description":"Slides the active item background and indicator between menu items.\nThe highlight travels to the newly active item instead of disappearing and reappearing.","label":"Slide highlight"},
      {"name":"activeIndicator","type":"\"none\" | \"bar\" | \"dot\"","default":"\"bar\"","description":"Marks the active item with a bar, dot, or no marker.\nChoose a thin bar, a small dot, or no additional marker for the current navigation item.","label":"Active indicator"},
    ] },
    { name: "Interaction", props: [
      {"name":"pressFeedback","type":"boolean","default":"false","description":"Compresses menu buttons while pressed.\nReleasing the press returns the button to its normal size for a small tactile response.","label":"Press feedback"},
      {"name":"rollingText","type":"boolean","default":"false","description":"Rolls the label to a copy of itself on hover.\nThe current text moves out while an identical copy moves in, keeping the label readable.","label":"Rolling text"},
      {"name":"elasticTooltips","type":"boolean","default":"false","description":"Adds spring motion to collapsed menu tooltips.\nThe tooltip settles into place with a small spring instead of a plain appearance. [Ignored on: mobile, expanded sidebar, items without tooltip]","label":"Elastic tooltips"},
    ] },
    { name: "Badges", props: [
      {"name":"rollingNumbers","type":"boolean","default":"true","description":"Rolls numeric badge values when they change.\nEach changed digit moves into place, making updates to counts easier to notice. [Ignored when: badge children are not numeric]","label":"Rolling numbers"},
    ] },
    { name: "Header", props: [
      {"name":"showTeamSwitcher","type":"Demo control","default":"false","description":"Makes the team identity in the sidebar header open a team-selection menu.\nChoosing a team updates the name and icon shown in the header.","label":"Show team switcher"},
      {"name":"spinToggle","type":"boolean","default":"false","description":"Rotates the sidebar toggle icon on hover.\nThe icon rotates as the pointer enters, adding feedback to the collapse/expand control.","label":"Spin toggle"},
      {"name":"showBreadcrumb","type":"Demo control","default":"true","description":"Shows the header bar with the current page breadcrumb and search control.\nTurn it off to use the compact sidebar toggle without that header bar.","label":"Show breadcrumb"},
    ] },
    { name: "Page", props: [
      {"name":"scaleContent","type":"Demo control","default":"true","description":"Adds a small scale transition when switching between the demo's pages.\nTurn it off to keep the fade transition without resizing the page content.","label":"Scale content"},
    ] },
  ],
} satisfies Record<string, HpxApiGroup[]>

export type HpxApiReferenceSlug = keyof typeof apiReferences
