import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ExternalLink,
  Globe,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import { useAdmin } from "@/lib/admin-state";
import { useAdminCreators } from "@/lib/admin-creators-state";

export const Route = createFileRoute("/admin/creators/$creatorId/profile")({
  component: CreatorProfileTab,
});

function CreatorProfileTab() {
  const { creatorId } = Route.useParams();
  const { currentUser } = useAdmin();
  const { getCreator, updateCreatorProfile } = useAdminCreators();

  const creator = getCreator(creatorId);

  const [name, setName] = useState(creator?.name || "");
  const [username, setUsername] = useState(creator?.username || "");
  const [avatar, setAvatar] = useState(creator?.avatar || "");
  const [coverImage, setCoverImage] = useState(creator?.coverImage || "");
  const [bio, setBio] = useState(creator?.bio || "");
  const [category, setCategory] = useState(creator?.category || "Drama");
  const [genres, setGenres] = useState(creator?.genres?.join(", ") || "");
  const [languages, setLanguages] = useState(creator?.languages?.join(", ") || "");
  const [location, setLocation] = useState(creator?.location || "");
  const [experience, setExperience] = useState(creator?.experience || "");
  const [portfolio, setPortfolio] = useState(creator?.portfolio || "");
  const [website, setWebsite] = useState(creator?.website || "");
  const [twitter, setTwitter] = useState(creator?.socialLinks?.twitter || "");
  const [instagram, setInstagram] = useState(creator?.socialLinks?.instagram || "");
  const [youtube, setYoutube] = useState(creator?.socialLinks?.youtube || "");
  const [linkedin, setLinkedin] = useState(creator?.socialLinks?.linkedin || "");

  if (!creator) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCreatorProfile(
      creator.id,
      {
        name,
        username,
        avatar,
        coverImage,
        bio,
        category,
        genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
        languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
        location,
        experience,
        portfolio,
        website,
        socialLinks: { twitter, instagram, youtube, linkedin },
      },
      currentUser?.name || "Admin"
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Verification Status Card */}
        <SectionCard
          title="Verification & Platform Governance"
          subtitle="Verification credential status, attested dates, and administrative reviewer"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">
                Verification Status
              </span>
              <StatusBadge status={creator.verificationStatus} />
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">
                Verified Date
              </span>
              <p className="font-semibold text-foreground">{creator.verifiedDate || "Pending Verification"}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <span className="text-muted-foreground uppercase text-[10px] font-bold block mb-1">
                Verified By
              </span>
              <p className="font-semibold text-foreground">{creator.verifiedBy || "Not Recorded"}</p>
            </div>
          </div>
        </SectionCard>

        {/* Identity & Basic Details */}
        <SectionCard
          title="Creator Identity & Media"
          subtitle="Public profile display information, identifiers, and media assets"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Display Name" required>
                <FormInput value={name} onChange={setName} />
              </FormField>
              <FormField label="Username Handle" required>
                <FormInput value={username} onChange={setUsername} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Avatar Image URL">
                <FormInput value={avatar} onChange={setAvatar} placeholder="https://..." />
              </FormField>
              <FormField label="Cover Banner Image URL">
                <FormInput value={coverImage} onChange={setCoverImage} placeholder="https://..." />
              </FormField>
            </div>

            <FormField label="Creator Bio / Tagline">
              <FormTextarea value={bio} onChange={setBio} rows={3} placeholder="Describe narrative specialty..." />
            </FormField>
          </div>
        </SectionCard>

        {/* Categorization & Metadata */}
        <SectionCard
          title="Genres, Languages & Categorization"
          subtitle="Taxonomy classification for content recommendations and editorial sorting"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Primary Category" required>
                <FormSelect
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "Drama", label: "Drama" },
                    { value: "Romance", label: "Romance" },
                    { value: "Thriller", label: "Thriller" },
                    { value: "Mystery", label: "Mystery" },
                    { value: "Sci-Fi", label: "Sci-Fi" },
                    { value: "Comedy", label: "Comedy" },
                    { value: "Supernatural", label: "Supernatural" },
                  ]}
                />
              </FormField>

              <FormField label="Geographic Location">
                <FormInput value={location} onChange={setLocation} placeholder="City, State" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Genres (comma-separated)">
                <FormInput value={genres} onChange={setGenres} placeholder="Drama, Romance, Thriller" />
              </FormField>
              <FormField label="Languages (comma-separated)">
                <FormInput value={languages} onChange={setLanguages} placeholder="Hindi, English, Telugu" />
              </FormField>
            </div>

            <FormField label="Professional Content Experience">
              <FormTextarea
                value={experience}
                onChange={setExperience}
                rows={2}
                placeholder="Years in industry, past studio productions, awards..."
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Links & Socials */}
        <SectionCard
          title="Portfolio & Social Footprint"
          subtitle="External portfolio links and social channel endpoints"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Portfolio URL">
                <FormInput value={portfolio} onChange={setPortfolio} placeholder="https://..." />
              </FormField>
              <FormField label="Official Website">
                <FormInput value={website} onChange={setWebsite} placeholder="https://..." />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <FormField label="Instagram">
                <FormInput value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
              </FormField>
              <FormField label="Twitter / X">
                <FormInput value={twitter} onChange={setTwitter} placeholder="https://twitter.com/..." />
              </FormField>
              <FormField label="YouTube">
                <FormInput value={youtube} onChange={setYoutube} placeholder="https://youtube.com/@..." />
              </FormField>
              <FormField label="LinkedIn">
                <FormInput value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/..." />
              </FormField>
            </div>
          </div>
        </SectionCard>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <AdminButton variant="primary" size="md">
            <Save className="size-4" /> Save Profile Changes
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
