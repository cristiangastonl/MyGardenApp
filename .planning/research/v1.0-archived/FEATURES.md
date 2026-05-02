# Feature Landscape

**Domain:** Plant care app — AI diagnosis with follow-up tracking
**Researched:** 2026-03-19
**Milestone scope:** Camera-in-chat + AI-powered problem tracking

---

## Context

This research covers two interrelated feature clusters for the V1.1 milestone:

1. **In-chat camera capture** — allowing users to take a photo directly inside the diagnosis chat instead of only picking from the gallery.
2. **AI-powered problem tracking** — a premium flow where the AI creates a follow-up schedule, sends reminders, re-diagnoses via new photos, and marks problems as resolved.

Competitor apps analyzed: Planta (Dr. Planta), PictureThis, PlantIn, Agrio, GrowMate, AI Plant Doctor, Blossom, ChatPlant.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken compared to peers.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Camera access from diagnosis chat | Every competing chat-based AI app (ChatPlant, PictureThis, PlantAI) offers camera + gallery in the same picker. Gallery-only feels unfinished. | Low | `expo-image-picker` is already installed; just add `launchCameraAsync` behind an action sheet alongside existing gallery path. |
| Action sheet / bottom sheet to choose camera vs. gallery | Standard iOS/Android UX pattern. Users expect a "take photo" vs "choose from library" choice, not to be sent to a different screen. | Low | Present a two-option bottom sheet on the attachment button tap. Apple HIG recommends fewer than 5 options. |
| Camera permission handled gracefully | If the user denies camera permission, the app must explain why and deep-link to Settings rather than silently failing. | Low | Expo image picker returns a status; show a contextual alert. |
| Thumbnail preview before sending in chat | Every chat UI with photo attachments shows a preview thumbnail inline before the message is submitted. | Low | Already pattern-matched by gallery path; extend to camera path. |
| Follow-up reminder push notification | All diagnosis-oriented apps (Planta, Blossom, AI Plant Doctor, Agrio) send a notification after diagnosis to remind users to check on the plant. Users have learned to expect this. | Medium | `expo-notifications` already configured. Requires scheduling a notification with a future trigger after AI determines follow-up date. |
| Problem visible in plant detail | Users expect to see the active problem when they navigate to the plant. Burying it only in chat history is not acceptable. | Medium | A "Problem" section or card in the plant detail screen listing active issues. |
| Manual close / resolve of a problem | Users must be able to dismiss a problem themselves. Apps that lock users into an AI-only resolution loop feel controlling and lose trust. | Low | A "Mark as resolved" button on the problem detail. |
| Status indicator on the plant card | A visual signal (color, badge, or icon) on the plant card in the plant list when a plant has an active problem. Users need to see at a glance which plants need attention without opening each one. | Low | Small dot or warning emoji on the plant card; driven by active problem state. |

---

## Differentiators

Features that set My Garden Care apart from competitors. Not universally expected, but meaningfully valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI-determined follow-up frequency (not user-configurable) | Competing apps (Planta, Blossom) let the user set reminder intervals manually — which means users have to know how urgent their problem is. Having the AI decide interval based on severity (e.g., fungus = every 3 days, yellowing = every 7 days) removes cognitive burden and feels more expert. | Medium | AI response from edge function includes a recommended follow-up day count alongside diagnosis. Store this in the problem record. |
| Follow-up task in "Hoy" screen | No competitor integrates diagnosis follow-ups into the daily task list alongside watering and sun care. This is a unique "plant doctor appointment" task type. | Medium | Requires `plantLogic.ts` `getTasksForDay()` to generate tasks from active problem records in addition to care schedules. |
| AI auto-resolve with confidence threshold | GrowMate tracks recovery scores but does not auto-resolve. Having the re-diagnosis step automatically close the problem when the AI detects improvement (with a user confirmation prompt) eliminates the "I forgot to close this" problem. | High | Edge function needs to return a resolution signal alongside re-diagnosis. Requires prompt engineering on the backend. |
| Problem timeline with photo history | GrowMate offers before/after comparisons. Making this a chronological timeline of photos and AI notes in the plant detail view creates a personal health journal for each plant — sticky, emotionally engaging, premium-feeling. | Medium | Store each diagnosis entry (photo URI, AI summary, timestamp, status) in the problem record's `entries` array in AsyncStorage. |
| Dual delivery of follow-up reminders (push + Hoy task) | Competitors send either a notification or an in-app reminder — not both. The dual path ensures users who ignore notifications still see the task in-app, and vice versa. | Low (given both systems already exist) | Push notification scheduling + a derived task from the problem record's `nextFollowUpDate` field. |
| Re-diagnosis in same chat context | When the user responds to a follow-up reminder and takes a new photo, they continue in the same diagnostic chat thread rather than starting a new one. This gives the AI continuity ("last time we saw X, now compare with Y"). | High | Requires the edge function to receive prior diagnosis context (or a summary) alongside the new photo. Chat session must be resumable from the problem record. |

---

## Anti-Features

Features to deliberately NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User-configurable follow-up interval | Adds UI complexity, puts burden on user to know plant medicine, and contradicts the core value prop ("AI decides"). If user can override, they blame themselves when it goes wrong. | AI sets the interval; only allow "check in early" as an override (manual re-diagnosis). |
| Problem severity score displayed as a number | Numeric severity (e.g., "7/10") creates anxiety and is not clinically meaningful in a consumer gardening context. GrowMate does this and it is confusing. | Use descriptive labels: "Watch closely", "Needs attention", "Recovering" — mapped to color states. |
| Push notification opt-in prompt at problem creation | Asking for push notification permission mid-diagnosis interrupts the flow and is rejected at higher rates. | Request notification permission at onboarding or first care reminder setup, which is already done. Problem tracking reuses the existing permission. |
| Multiple concurrent open problems per plant, each with their own full chat thread | This creates chat management complexity and confuses users. Every app that tries to have multiple parallel chat threads per subject eventually consolidates. | Allow multiple active problems (e.g., pests AND root rot) but render them as separate cards, not separate full chat sessions. Re-diagnosis funnels through one shared chat. |
| Social or sharing features for the problem timeline | Sharing plant disease photos to a feed or community (like PlantIn's social features) is a separate feature vector requiring moderation infrastructure. It is out of scope for this milestone. | Keep problem timeline private; add sharing as a future DLC feature if validated. |
| Photo editing / crop before sending in chat | Competing apps sometimes add crop/rotate steps for diagnosis photos, which adds friction. Users want to send the photo and get an answer fast. | Disable `allowsEditing` in the image picker config for diagnosis. Let AI work with the raw capture. |
| Offline diagnosis | This requires on-device model hosting (gigabytes of storage) and is not viable in this stack. | Show a clear "No connection" message rather than attempting degraded offline diagnosis. |

---

## Feature Dependencies

```
Camera in chat
└── Action sheet (camera vs. gallery choice)
    └── Camera permission handling
    └── Thumbnail preview in chat (already exists for gallery)

Problem Tracking
├── AI diagnosis (already exists)
├── Problem created from diagnosis
│   ├── AI determines follow-up date (edge function change)
│   └── Problem record stored in AsyncStorage
│       ├── Status indicator on plant card  <-- reads active problem state
│       ├── Problem section in plant detail <-- reads problem record
│       ├── Problem timeline in plant detail <-- reads problem.entries[]
│       ├── Follow-up push notification scheduled  <-- reads nextFollowUpDate
│       └── Follow-up task in "Hoy" screen  <-- reads nextFollowUpDate via plantLogic.ts
│
└── Re-diagnosis (follow-up photo)
    ├── Camera in chat (dependency on cluster 1)
    ├── Prior context sent to edge function
    └── AI auto-resolve signal
        └── Auto-resolve with user confirmation
            └── Manual reopen option
```

---

## MVP Recommendation for This Milestone

Prioritize (ship in this milestone):

1. **Camera in chat** — low complexity, high user frustration when missing, unblocks re-diagnosis flow.
2. **Action sheet (camera vs. gallery)** — required to deliver camera in chat gracefully.
3. **Problem record data model** — everything downstream depends on this; define it early.
4. **Problem card in plant detail + status dot on plant list card** — minimal UI surface, establishes the problem as a first-class entity.
5. **Follow-up push notification** — leverages existing `expo-notifications` infrastructure; core of the premium value prop.
6. **Follow-up task in "Hoy" screen** — leverages existing `getTasksForDay()` pattern; gives in-app visibility without push dependency.
7. **Manual resolve** — table stakes for user control; low complexity.
8. **Problem timeline (photo + AI note per entry)** — the visual payoff that makes tracking feel worthwhile.

Defer (later milestone or future DLC):

- **Re-diagnosis in same chat thread with prior context**: High complexity edge function change. Deliver re-diagnosis as a new chat session for now; add continuity when cloud sync is ready.
- **AI auto-resolve with confidence signal**: Requires prompt engineering iteration and testing. Manual resolve covers the MVP need; auto-resolve is a V1.2 enhancement.
- **Severity labels beyond "active/resolved"**: Can be added incrementally once the problem model is stable.

---

## Sources

- [Best Plant Care Apps in 2026 — MyPlantIn](https://myplantin.com/blog/best-plant-care-apps) — MEDIUM confidence (blog, cross-referenced with app listings)
- [Agrio: An app that identifies plant diseases](https://agrio.app/An-app-that-identifies-plant-diseases-and-pests/) — MEDIUM confidence (official product page)
- [GrowMate — AI Plant Doctor](https://growmate.pro/) — LOW confidence (marketing page only; no independent review)
- [Planta App Store listing](https://apps.apple.com/us/app/planta-ai-plant-garden-care/id1410126781) — HIGH confidence (official store listing)
- [Planta App features review — gardening.alibaba.com](https://gardening.alibaba.com/plant-care/planta-app) — MEDIUM confidence
- [AI Plant Doctor App](https://theaiplantdoctor.com/) — LOW confidence (small app, limited reviews)
- [Expo ImagePicker documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) — HIGH confidence (official Expo docs)
- [Action sheets — Apple HIG](https://developer.apple.com/design/human-interface-guidelines/components/presentation/action-sheets) — HIGH confidence (official Apple documentation)
- [Stream React Native Native Image Picker guide](https://getstream.io/chat/docs/sdk/react-native/guides/native-image-picker/) — HIGH confidence (official SDK docs)
- [Timeline UX Pattern](https://uxpatterns.dev/patterns/data-display/timeline) — MEDIUM confidence (community UX reference)
- [Healthcare UX Design Trends 2025 — Webstacks](https://www.webstacks.com/blog/healthcare-ux-design) — MEDIUM confidence (applicable patterns for follow-up scheduling)
