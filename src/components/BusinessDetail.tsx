import ReviewSection from './ReviewSection'

type BusinessDetailProps = {
  business: {
    id: number | string
    business_name?: string | null
    services?: string[]
    description?: string | null
    phone?: string | null
    distance_km?: number | null
    average_rating?: number | null
    review_count?: number | null
  }
  onBack: () => void
}

export default function BusinessDetail({
  business,
  onBack,
}: BusinessDetailProps) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm font-semibold text-gray-500 transition hover:text-gray-950"
      >
        ← Back to results
      </button>

      <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {business.average_rating != null &&
              business.review_count != null &&
              business.review_count > 0 && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900">
                    ★ {business.average_rating.toFixed(1)}
                  </span>

                  <span className="text-gray-400">
                    ({business.review_count}{' '}
                    {business.review_count === 1
                      ? 'review'
                      : 'reviews'})
                  </span>
                </div>
              )}

            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              {business.business_name || 'Local business'}
            </h1>

            {business.services &&
              business.services.length > 0 && (
                <p className="mt-2 text-base text-gray-500">
                  {business.services.join(' · ')}
                </p>
              )}

            {business.distance_km != null &&
              Number.isFinite(business.distance_km) && (
                <p className="mt-2 text-sm text-gray-400">
                  {business.distance_km < 1
                    ? `${Math.round(
                        business.distance_km * 1000,
                      )} m away`
                    : `${business.distance_km.toFixed(
                        1,
                      )} km away`}
                </p>
              )}
          </div>

          {business.phone ? (
            <a
              href={`tel:${business.phone}`}
              className="shrink-0 rounded-xl bg-gray-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Call
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="shrink-0 rounded-xl bg-gray-300 px-6 py-3 text-sm font-semibold text-white"
            >
              Call
            </button>
          )}
        </div>

        <div className="my-7 h-px bg-gray-100" />

        {business.description && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                About this business
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                {business.description}
              </p>
            </div>

            <div className="my-7 h-px bg-gray-100" />
          </>
        )}

        {business.services &&
          business.services.length > 0 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Services
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {business.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div className="my-7 h-px bg-gray-100" />
            </>
          )}

        <ReviewSection
          businessId={business.id}
          averageRating={business.average_rating}
          reviewCount={business.review_count}
        />
      </article>
    </section>
  )
}