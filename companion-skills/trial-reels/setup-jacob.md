# Making a teammate's Instagram key for them (Jacob's side, the fallback)

**Usually the teammate makes their own key** (setup.md, step 2), after Jacob adds them to the
Campusai business portfolio with Full control. That is how Ashley was set up on Nov 9. Use this
file only when someone cannot have Full control and Jacob makes the key for them instead.

Each person gets their OWN key from their own system user, so one can be switched off without
touching anyone else's.

Do it in Jacob's Chrome (Claude in Chrome), with him there for anything Meta asks him to confirm.

1. Open business.facebook.com/settings, business portfolio **Campusai**, Users, **System users**.
2. **Add** a system user named after the person, ONE word (Meta refuses names with spaces), for
   example `Ashley`. Role: Employee.
3. **Assign assets** to it:
   - Instagram account @campusai_: Content, Community activity, Insights.
   - Facebook Page "Campusai": Content, Insights.
   - App "CampusAI Studio": Develop app.
4. **Generate new token**: app CampusAI Studio, expiry **Never**, and tick the Instagram and Page
   permissions offered (Meta adds every app permission to the key anyway; our rule is that our
   system never deletes and never DMs).
5. Meta shows the key once. Jacob copies it into a new text file on his Desktop named
   `instagram-key-<name>.txt` (Claude opens TextEdit for him; Claude never reads or pastes the key).
6. Jacob AirDrops that file to the teammate, then deletes it from his Desktop and empties it from
   the Trash.
7. Their Claude runs `connect.py` on it (setup.md, step 2, sub-step 6, pointing at the AirDropped
   file instead), which checks it and deletes their copy.

To switch someone off later: the same System users page, their name, **Revoke tokens**, or remove
the system user.
