# Store review checklists

Filled in for this app rather than left as blank templates. Where an answer would be
speculative, it says so.

**No submission has been made to either store.** These are the checks that would run before
one.

---

## App Store review

### The rejections this app is actually at risk of

Not the generic list. These four are the ones that apply here:

| Guideline | Risk | Answer |
|-----------|------|--------|
| 5.1.1 Data collection and storage | High. The app collects precise location | Permission is requested in context with a written explanation, background access is escalated only after an incident opens, and the privacy policy states retention per data type |
| 5.1.2 Data use and sharing | High. Location is shared with third parties, namely the user's contacts | Sharing is two independent switches, both default-reviewable, and the contact link is scoped to one incident |
| 1.4.1 Physical harm | **Highest.** A safety app that implies emergency capability it does not have | The demonstration notice appears on first launch, is not dismissible in the header, and states plainly that emergency services are not contacted. This is the single most likely rejection and the mitigation is deliberately heavy-handed |
| 2.1 App completeness | Medium. Demo accounts and sandbox subscriptions | Reviewer credentials are supplied in the review notes, and the StoreKit configuration is sandbox-only |

### Checklist

- [ ] Demonstration notice visible on first launch, before any account is created
- [ ] Notice repeated on the active-incident screen, where the implication is strongest
- [ ] Privacy nutrition labels match what the app actually collects: location, contact
      info, identifiers. Location marked as linked to identity and used for app
      functionality, not tracking
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) declares every required-reason API used
- [ ] Location permission strings say what the location is for, not "to improve your
      experience"
- [ ] `NSLocationAlwaysAndWhenInUseUsageDescription` explains why background access is
      needed and when it is requested
- [ ] Background modes limited to `location`, and only active during an incident
- [ ] Reviewer account supplied, with at least one seeded incident so the flow can be seen
      without waiting
- [ ] Subscription products configured, sandbox tested, restore purchases works
- [ ] No placeholder text, no lorem ipsum, no obviously stubbed screen
- [ ] Support URL and privacy policy URL both resolve
- [ ] Screenshots show real seeded data, no real personal information
- [ ] Release notes are readable prose, not a commit dump

### Privacy manifest

Required-reason APIs this app uses and the reason codes:

| API | Reason |
|-----|--------|
| `UserDefaults` | `CA92.1` — access to app-specific defaults only |
| File timestamp | `C617.1` — display to the user, incident times |
| Disk space | `E174.1` — write only when space allows, for the offline queue |

Collected data types declared: precise location, coarse location, email address, name,
phone number (of contacts), user ID. All marked linked to identity, used for app
functionality, and **not** used for tracking.

---

## Google Play review

### Declarations this app must get right

| Item | Answer |
|------|--------|
| Background location access | **Requires a written justification and a demo video.** The justification is that an incident is a user-initiated, foreground-started event and location is shared only while it is open. This review takes weeks and is the single biggest scheduling risk |
| Foreground service type | `location`, with a persistent notification. Declared in the manifest and justified in the console |
| Sensitive permissions | No SMS, no call log, no contacts read. The app asks the user to type contact details rather than reading their address book, specifically to avoid this |
| Data safety form | Completed below |
| Target API level | 34, within the current requirement |

### Data safety form

| Data type | Collected | Shared | Optional | Purpose |
|-----------|-----------|--------|----------|---------|
| Precise location | Yes | Yes, with user-nominated contacts | Yes, per contact and per account | App functionality |
| Approximate location | Yes | Yes | Yes | App functionality |
| Name | Yes | No | No | App functionality |
| Email address | Yes | No | No | Account management |
| Phone number | Contacts only | No | Yes | App functionality |
| User IDs | Yes | No | No | App functionality |
| Crash logs | No | No | — | Not collected |
| Analytics | No | No | — | Off by default and not implemented |

All data is encrypted in transit. Users can request deletion in-app. Location history is
off by default and expires on a TTL.

### Checklist

- [ ] Data safety form matches the table above and matches the code
- [ ] Background location justification written, with a demo video showing the in-context
      request
- [ ] Foreground service type declared and justified
- [ ] Target API 34
- [ ] App bundle signed with the upload key, enrolled in Play App Signing
- [ ] Internal testing track exercised on a real device before promotion
- [ ] Store listing states clearly that this is a demonstration
- [ ] Content rating questionnaire completed
- [ ] Licence tester accounts configured for the billing flow

---

## What both stores will ask that this app cannot answer

Being honest about this rather than pretending the checklists are complete:

- **"What happens if a user relies on this in an emergency?"** The only answer is the
  demonstration notice. A real product would need an escalation path to something that
  actually responds, and this has none by design.
- **"Who monitors the operator console?"** Nobody. It is a demonstration.
- **"What is your data retention agreement with your processors?"** There are no
  processors, because nothing is deployed.

A real submission would need real answers to all three. This app would not be submitted.
