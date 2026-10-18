import { useParams } from 'react-router-dom';
import { CATEGORY_LABELS, PHOTOS, u, type SalonCategory } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Img } from '@/components/ui';
import Explore from './Explore';
import { NotFound } from './StaticPages';

const INTRO: Record<SalonCategory, [string, string, string]> = {
  parrucchiere: ['Tagli su misura, colore couture, trattamenti che rispettano il capello.', 'Tailored cuts, couture colour, treatments that respect your hair.', PHOTOS.hairStyling[0]],
  barber: ['Rasature a panno caldo, skin fade e il rito della barba fatto come si deve.', 'Hot towel shaves, skin fades and the beard ritual done right.', PHOTOS.barber[4]],
  unghie: ['Semipermanente, gel e nail art da studi che curano ogni dettaglio.', 'Gel polish, extensions and nail art from detail-obsessed studios.', PHOTOS.nails[2]],
  estetica: ['Trattamenti viso, ciglia e sopracciglia con dermocosmesi professionale.', 'Facials, lashes and brows with professional skincare.', PHOTOS.face[2]],
  spa: ['Massaggi, rituali e percorsi benessere per staccare davvero.', 'Massages, rituals and wellness journeys to truly unwind.', PHOTOS.spa[4]],
};

export default function CategoryPage() {
  const { slug } = useParams();
  const t = useT();
  const lang = useStore((s) => s.lang);
  const cat = slug as SalonCategory;
  if (!CATEGORY_LABELS[cat]) return <NotFound />;
  const [it, en, img] = INTRO[cat];
  return (
    <>
      <section className="wrap pt-8">
        <div className="relative overflow-hidden rounded-[32px] on-dark">
          <Img src={u(img, 2000)} className="h-[340px] md:h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-end p-8 md:p-14">
            <div className="eyebrow">{t('Categoria', 'Category')}</div>
            <h1 className="mt-3 text-6xl leading-none md:text-[88px]">{lang === 'it' ? CATEGORY_LABELS[cat].it : CATEGORY_LABELS[cat].en}</h1>
            <p className="mt-4 max-w-md text-ivory/80">{lang === 'it' ? it : en}</p>
          </div>
        </div>
      </section>
      <Explore fixedCat={cat} />
    </>
  );
}
