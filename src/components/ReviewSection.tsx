import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Review = {
  id: string
  rating: number
  review: string | null
  created_at: string
  user_id: string
}

type ReviewSectionProps = {
  businessId: number | string
  averageRating?: number | null
  reviewCount?: number | null
  userId?: string | null
}

const StarRow = ({
  value,
  interactive = false,
  onChange,
}: {
  value: number
  interactive?: boolean
  onChange?: (rating: number) => void
}) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          className={`text-xl leading-none transition ${
            star <= value
              ? 'text-yellow-500'
              : 'text-gray-300'
          } ${
            interactive
              ? 'cursor-pointer hover:scale-110'
              : 'cursor-default'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReviewSection({
  businessId,
  averageRating,
  reviewCount,
  userId = null,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const numericBusinessId = Number(businessId)

  const loadReviews = async () => {
    setLoading(true)
    setError('')

    if (!Number.isFinite(numericBusinessId)) {
      setError('This business could not be loaded.')
      setReviews([])
      setLoading(false)
      return
    }

    const { data, error: reviewsError } = await supabase
      .from('business_reviews')
      .select(
        'id, rating, review, created_at, user_id',
      )
      .eq('business_id', numericBusinessId)
      .order('created_at', {
        ascending: false,
      })

    if (reviewsError) {
      console.error(
        'Could not load reviews:',
        reviewsError,
      )

      setError(
        'Could not load reviews right now.',
      )
      setReviews([])
    } else {
      setReviews(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadReviews()
  }, [numericBusinessId])

  const handleSubmitReview = async () => {
    setError('')
    setSuccess('')

    if (!userId) {
      setError(
        'Please sign in to leave a review.',
      )
      return
    }

    if (!Number.isFinite(numericBusinessId)) {
      setError(
        'This business could not be identified.',
      )
      return
    }

    if (rating < 1 || rating > 5) {
      setError(
        'Please choose a rating from 1 to 5 stars.',
      )
      return
    }

    const cleanReview = reviewText.trim()

    if (!cleanReview) {
      setError(
        'Please write a short review.',
      )
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase
      .from('business_reviews')
      .insert({
        business_id: numericBusinessId,
        user_id: userId,
        rating,
        review: cleanReview,
      })

    if (insertError) {
      console.error(
        'Could not submit review:',
        insertError,
      )

      setError(
        insertError.message ||
          'Could not submit your review.',
      )
      setSubmitting(false)
      return
    }

    setRating(0)
    setReviewText('')
    setSuccess(
      'Thanks! Your review has been added.',
    )

    await loadReviews()

    setSubmitting(false)
  }

  const calculatedRating =
    reviews.length > 0
      ? reviews.reduce(
          (sum, item) => sum + item.rating,
          0,
        ) / reviews.length
      : 0

  const displayedRating =
    averageRating != null
      ? Number(averageRating)
      : calculatedRating

  const displayedCount =
    reviewCount != null
      ? Number(reviewCount)
      : reviews.length

  return (
    <section className="mt-8 border-t border-gray-100 pt-8">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Reviews
          </h2>

          {displayedCount > 0 ? (
            <div className="flex items-center gap-2">
              <StarRow
                value={Math.round(displayedRating)}
              />

              <span className="text-sm font-medium text-gray-700">
                {displayedRating.toFixed(1)}
              </span>

              <span className="text-sm text-gray-400">
                · {displayedCount}{' '}
                {displayedCount === 1
                  ? 'review'
                  : 'reviews'}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">
              No reviews yet
            </span>
          )}
        </div>
      </div>

      {userId ? (
        <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <h3 className="mb-3 text-base font-semibold text-gray-900">
            Share your experience
          </h3>

          <div className="mb-4">
            <StarRow
              value={rating}
              interactive
              onChange={setRating}
            />
          </div>

          <textarea
            value={reviewText}
            onChange={(event) =>
              setReviewText(event.target.value)
            }
            placeholder="How was your experience?"
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              {reviewText.length}/1000
            </span>

            <button
              type="button"
              onClick={() =>
                void handleSubmitReview()
              }
              disabled={submitting}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Submitting...'
                : 'Submit review'}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-3 text-sm text-green-600">
              {success}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <p className="text-sm text-gray-600">
            Sign in to share your experience and leave
            a review.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {loading ? (
          <p className="text-sm text-gray-400">
            Loading reviews...
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-400">
            No reviews yet. Be the first to share your
            experience.
          </p>
        ) : (
          reviews.map((item) => (
            <article
              key={item.id}
              className="border-b border-gray-100 pb-5 last:border-b-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRow value={item.rating} />

                <time
                  dateTime={item.created_at}
                  className="text-xs text-gray-400"
                >
                  {new Date(
                    item.created_at,
                  ).toLocaleDateString()}
                </time>
              </div>

              {item.review && (
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {item.review}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}