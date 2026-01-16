# BlackBook AI Integration: PM Implementation Guide

**Quick reference for PM team to execute the roadmap.**

---

## 📋 Pre-Launch Checklist (Week 1-2)

### Planning
- [ ] Schedule kickoff meeting with engineering + PM team
- [ ] Assign issue owners (one engineer per epic)
- [ ] Finalize milestone dates (when to launch each phase)
- [ ] Set up GitHub project board: "BlackBook AI Integration"
- [ ] Create Slack channel: #ai-integration

### OpenRouter Account Setup
- [ ] Create OpenRouter account (openrouter.ai/signup)
- [ ] Generate API key
- [ ] Add API key to `.env` (never commit)
- [ ] Set up billing alerts ($50 monthly budget initially)
- [ ] Review OpenRouter pricing (https://openrouter.ai/docs/pricing)
- [ ] Document: which models are in-scope vs out-of-scope

### Metrics & Monitoring
- [ ] Create Sentry account for error tracking (sentry.io)
- [ ] Set up Google Analytics / PostHog for user adoption tracking
- [ ] Create admin dashboard template (Grafana or simple React dashboard)
- [ ] Define success metrics per epic (see Roadmap.md)

### Design Review
- [ ] AI UX guidelines: where do badges appear? What does "Powered by AI" look like?
- [ ] Chat UI mockups approved (Figma/design tool)
- [ ] Error state designs (what if AI fails?)
- [ ] Accessibility review: all AI features accessible? WCAG 2.1 AA?

### Legal & Privacy
- [ ] Review OpenRouter ToS (no training on customer data ✓)
- [ ] Update Privacy Policy: "AI Features" section
- [ ] GDPR/CCPA compliance check (right to deletion, data export)
- [ ] Create opt-in consent flow copy (what do users need to agree to?)
- [ ] Document data retention policy (how long do we keep AI logs?)

---

## 🚀 Phase 1 Launch (Weeks 3-8)

### Week 3-4: MVP Engineering
**What's shipping**: Chat UI + OpenRouter integration + RAG

**Epic 6 Tasks** (parallel with Epic 1):
- [ ] Implement feature flags system
- [ ] Set up cost tracking database
- [ ] Create error handling middleware
- [ ] Model versioning & configuration

**Epic 1 Tasks**:
- [ ] Issue #101: Chat UI Component (use shadcn/ui Sheet + Card)
- [ ] Issue #102: OpenRouter API client + middleware
- [ ] Issue #103: RAG system (vectorize trades, similarity search)
- [ ] Issue #104: Cost tracking dashboard (user-facing)

**Testing Checklist**:
- [ ] Chat interface responsive on mobile/desktop
- [ ] OpenRouter API calls logging costs correctly
- [ ] RAG retrieves relevant trades
- [ ] Error handling: try failing API calls, confirm graceful fallback
- [ ] Rate limiting: verify 10 queries/day enforcement

### Week 5: Internal Testing
**Who**: Engineering + PM team only (no external users yet)

- [ ] Test user: use chat to ask questions about your own trades
- [ ] Verify costs are accurate (compare OpenRouter invoice)
- [ ] Load testing: can system handle 100 concurrent chat queries?
- [ ] Security: can't see other users' trades via chat?
- [ ] Edge cases:
  - New user with 0 trades → what does RAG return?
  - Large account with 1000 trades → latency acceptable?
  - Rapid fire queries → rate limiting kicks in?

**Document Findings**:
- [ ] Create internal wiki page: "AI Feature Testing Results"
- [ ] Note any bugs/issues found
- [ ] Estimate fixes needed before beta

### Week 6: Design & Copy Review
- [ ] Review all error messages (clear to non-technical users?)
- [ ] A/B test badge placement: top-left vs top-right vs inline?
- [ ] Review "Powered by AI" copy in Settings
- [ ] Verify tooltips explain each feature
- [ ] Accessibility audit: screen reader tested?

### Week 7: Beta Launch Prep
- [ ] Create beta signup form (Google Form or Typeform)
- [ ] Recruit 50 beta users (use existing user base, offer perks)
- [ ] Create beta user guide: "How to use AI Chat"
- [ ] Set up feedback form (Typeform or direct Slack link)
- [ ] Prepare support playbook: common questions + answers

**Beta User Criteria**:
- 80% existing active users (already use app regularly)
- Mix of beginners (< 3 months) and veterans (> 1 year)
- Geographic diversity (capture timezone effects)
- Different strategies (options, stocks, spreads, etc.)

### Week 8: Beta Launch 🚀
- [ ] Announce to beta cohort: email + in-app notification
- [ ] Monitor error rates (Sentry dashboard)
- [ ] Track API costs (don't exceed $500 for 50 users)
- [ ] Daily sync: any critical bugs?
- [ ] Collect feedback: chat, forms, usage metrics
- [ ] Prepare Phase 2 (Pattern Discovery) in parallel

**Success Criteria for Phase 1**:
- [ ] 40%+ of beta users use chat at least once
- [ ] 80%+ of queries complete without errors
- [ ] Costs within budget ($500 for beta month)
- [ ] Net Promoter Score (NPS) ≥ 30 on beta feedback
- [ ] Zero security incidents (no data leaks)

---

## 📊 Phase 2 Launch (Weeks 9-16)

### Epics to Ship
- [ ] **Epic 2**: Pattern Discovery Engine (+ insights display)
- [ ] **Epic 3**: Smart Trade Notes (sentiment tagging + pattern matching)

### Week 9-10: Build Pattern Discovery
**What ships**: Nightly insights job + dashboard widget

- [ ] Issue #201: Pattern analyzer backend
- [ ] Issue #202: Insights schema in database
- [ ] Issue #203: Insights widget on home page
- [ ] Issue #204: A/B test Claude vs GPT-4 for pattern analysis

**Testing**:
- [ ] Run analyzer on beta users' historical data
- [ ] Review generated insights for accuracy
- [ ] Verify confidence scores are calibrated
- [ ] Performance: can process 1000-trade account in <5min?

### Week 11-12: Build Smart Trade Notes
**What ships**: Sentiment tagging + pattern warnings

- [ ] Issue #301: Notes editor + sentiment tagging (use Mixtral)
- [ ] Issue #302: Pattern matcher (warn on risky trades)
- [ ] Issue #303: Voice-to-text integration (Whisper)
- [ ] Issue #304: Risk warning system

**A/B Testing**:
- [ ] 50% users: see sentiment tags
- [ ] 50% users: no sentiment (control group)
- [ ] Metric: does tagging help traders make better decisions?

### Week 13: Feature Testing
- [ ] Insights generated for all beta users
- [ ] Sentiment tags show up on existing trades
- [ ] Voice recording works on mobile
- [ ] Pattern warnings don't false-alarm

### Week 14: Opt-In & Education
- [ ] Email beta users: "New insights to improve your trading"
- [ ] In-app tooltip: how to use each feature
- [ ] Create help articles (screenshot guides)
- [ ] Forum post: "Community Q&A on AI insights"

### Week 15-16: Expand Beta
- [ ] Expand to 200 more users (gradual rollout)
- [ ] Monitor costs: should be 3-4x Phase 1 costs
- [ ] Gather feedback: which insights most valuable?
- [ ] Iterate: adjust insight generation based on feedback

**Success Criteria for Phase 2**:
- [ ] 50%+ of users view insights at least once
- [ ] Sentiment accuracy > 85% (manual spot-check)
- [ ] Pattern warnings prevent at least 5-10 bad trades (track outcomes)
- [ ] Costs within forecast (no surprises)
- [ ] Users report "more disciplined trading" in feedback

---

## 🎯 Phase 3 Launch (Weeks 17-24)

### Epics to Ship
- [ ] **Epic 4**: Exit Strategy Advisor
- [ ] **Epic 5**: Community Insights
- [ ] **Full Rollout**: Move from beta → all users

### Week 17-20: Build Exit Advisor + Community Insights
- [ ] Issue #401-404: Exit Strategy Advisor
- [ ] Issue #501-504: Community Insights

### Week 21: Full Rollout Planning
- [ ] Which features go to free tier vs premium?
- [ ] Pricing strategy finalized (free = sentiment only, $5/mo = all features?)
- [ ] Create marketing copy: "AI-Powered Trading Journal"
- [ ] Blog post: "How AI Improves Trading Decisions"
- [ ] Email campaign: existing users → opt-in to new features

### Week 22-24: Public Launch 🎉
- [ ] Remove "beta" label
- [ ] Monitor metrics religiously (daily check-in)
- [ ] Support team ready for questions
- [ ] Prepare Month 1 post-launch report: adoption, costs, learnings

---

## 💰 Cost Management (Ongoing)

### Budget Tracking
**Monthly Budget by Phase**:
| Phase | Users | Estimated Cost | Cost/User |
|-------|-------|-----------------|-----------|
| Phase 1 | 50 beta | $500 | $10 |
| Phase 2 | 250 expand | $2,000 | $8 |
| Phase 3 | 1000 launch | $5,000 | $5 |
| Year 2 | 5000 growth | $20,000 | $4 |

### Cost Optimization
1. **Use cheaper models for classific sation**: Mixtral >> Claude for sentiment
2. **Batch processing**: Run insights daily at 2 AM (not real-time)
3. **Caching**: Store recent embeddings, don't recompute
4. **A/B test models**: Phase out expensive models if cheaper alternatives win
5. **Free tier limits**: Sentiment-only for free users (cheap), full features for $5/mo

### Red Flags (Escalate Immediately)
- [ ] Daily API costs exceed budget by 20%+
- [ ] Error rate > 5% (indicates problems with API)
- [ ] User feedback: "AI giving wrong advice, lost money"
- [ ] Security issue: user data leaked

---

## 📈 Success Metrics Dashboard

**Track these weekly** (create dashboard):

### Adoption
- % of active users using each AI feature
- Avg queries/user/week
- Feature retention (% still using after 2 weeks)

### Quality
- User satisfaction (thumbs up % on AI responses)
- Accuracy (sentiment correct %, insights match outcomes)
- Error rate (% of API calls that fail)

### Business
- Cost per user per month (vs plan)
- Cost per query (optimize models if spiking)
- Revenue impact (if premium tier, how many upgrade for AI?)

### Engagement
- Click-through rate on insights
- Save/bookmark rate on community insights
- Share rate (via Twitter, email, etc.)

---

## 🤝 Team Sync Cadence

**Weekly** (30 min):
- Engineering: blockers, progress on issues
- PM: metrics review, beta feedback
- Decision: any scope changes or priority shifts?

**Bi-weekly** (1 hour):
- Feature review: demo completed work
- Feedback analysis: what are beta users saying?
- Budget review: on track or need to adjust?

**Monthly** (1.5 hours):
- Phase retrospective: what worked, what didn't?
- Plan next phase epics in detail
- Competitive intelligence: how are Edgewonk/Tradervue evolving?

---

## 📞 Decision Log

Use this to document major decisions made during execution:

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 1/15 | Start with Claude Sonnet for chat | Best reasoning for Q&A | [PM Name] |
| [TBD] | Launch exit advisor in Phase 3 not Phase 2 | Lower priority, needs more test data | [PM Name] |
| [TBD] | Free tier: sentiment tagging only | Keeps costs low for users | [PM Name] |

---

## 🚨 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| OpenRouter API costs exceed $20k/mo | Medium | High | Cap users/month, set hard budget limit |
| Users rely on AI for trading decisions, lose money | Low | Critical | Clear disclaimers, "not financial advice" |
| Community insights accidentally leak user data | Very Low | Critical | 3rd-party privacy audit before Phase 3 launch |
| A model provider goes down (e.g., OpenAI API offline) | Low | Medium | Implement fallback model chain, graceful degradation |
| User backlash: "I don't want AI making decisions for me" | Medium | Medium | Emphasize AI as **assistant**, not replacement for human judgment |

---

## Quick Reference: Model Selection

Use this when deciding which model to use:

- **Conversational, reasoning-heavy**: Claude Sonnet 4.5 ($0.003 in, $0.015 out per 1K tokens)
- **Fast batch analysis**: GPT-4 Turbo ($0.01 in, $0.03 out)
- **Quick classification**: Mixtral 8x7B ($0.00014 in, $0.00042 out) — 70x cheaper
- **Coding/complex logic**: Claude Opus 4.5 (best quality, 2x cost of Sonnet)
- **Cost-conscious default**: Llama 2 70B ($0.00047 in, $0.00063 out)

**Decision Tree**:
```
Is this real-time? → No → Use batch model (GPT-4 Turbo)
Does it need reasoning? → Yes → Claude Sonnet
Is it just classification? → Yes → Mixtral
Cost is critical? → Yes → Mixtral or Llama
User can wait 30s? → Yes → Batch + optimize model
```

---

## Appendix: External Resources

- **OpenRouter Docs**: https://openrouter.ai/docs/quickstart
- **OpenRouter Model Browser**: https://openrouter.ai/models
- **Claude Model Card**: https://www.anthropic.com/claude
- **GPT-4 Turbo Docs**: https://platform.openai.com/docs/models
- **Mixtral 8x7B Blog**: https://mistral.ai/news/mixtral-of-experts/

---

**Questions?** Slack #ai-integration or email the PM lead.

Last updated: January 15, 2026

